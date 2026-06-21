import { getClientIp, checkAndIncrementRateLimit } from "./_lib/rateLimit.js";
import { callGroqJSON } from "./_lib/groq.js";

// Pro-only feature: full resume rewrite tailored to the job description.
// Gating between free/Pro happens client-side (consistent with the rest of
// the scanner), so this is just an anti-abuse throttle on the shared key.
// Lower ceiling than the lightweight previews since this is a much larger
// generation (full resume text, not one field or one bullet).
const DAILY_IP_LIMIT = 40;

const SCHEMA = {
  type: "object",
  properties: {
    rewrittenResume: { type: "string" },
    summaryOfChanges: { type: "array", items: { type: "string" } },
  },
  required: ["rewrittenResume", "summaryOfChanges"],
  additionalProperties: false,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Resume and job description are required." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    const ip = getClientIp(req);
    const { allowed } = await checkAndIncrementRateLimit(ip, {
      collection: "scanFullRewriteRateLimits",
      limit: DAILY_IP_LIMIT,
    });

    if (!allowed) {
      return res.status(429).json({ error: "Too many requests. Try again tomorrow." });
    }
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }

  const systemPrompt = `You are an expert resume writer and ATS optimization specialist. Rewrite the ENTIRE resume to be a stronger match for the job description: tailor wording to the job's key terms, quantify impact wherever plausible, tighten weak or vague phrasing, and reorganize bullet points for clarity — without inventing facts, employers, titles, or dates that aren't in the original. Preserve section structure (e.g. Experience, Education, Skills) but improve the writing throughout. Use \\n to preserve line breaks in the rewritten resume text. Keep "summaryOfChanges" to 3-5 short, concrete bullets (e.g. "Added measurable impact to 6 bullet points", "Replaced passive phrasing with action verbs", "Worked in 8 missing ATS keywords from the job description").`;

  const userPrompt = `ORIGINAL RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  try {
    const { result } = await callGroqJSON({
      apiKey,
      systemPrompt,
      userPrompt,
      schemaName: "resume_rewrite",
      schema: SCHEMA,
      temperature: 0.4,
      maxTokens: 4096,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Groq error:", err);
    return res.status(500).json({ error: "Failed to generate resume rewrite." });
  }
}
