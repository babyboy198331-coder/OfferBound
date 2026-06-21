import { getClientIp, checkAndIncrementRateLimit } from "./_lib/rateLimit.js";
import { callGroqJSON } from "./_lib/groq.js";

// Lightweight, cheap call (small output, low token budget) so we can afford
// a much more generous per-IP ceiling than the full /api/analyze endpoint.
// This does NOT count against the user's free/Pro scan limit — it's just
// instant feedback while they're still filling out the form.
const DAILY_IP_LIMIT = 300;

const SCHEMA = {
  type: "object",
  properties: {
    difficultyScore: { type: "number" },
    requiredSkills: { type: "array", items: { type: "string" } },
    keywords: { type: "array", items: { type: "string" } },
    quickMatchEstimate: { type: ["number", "null"] },
  },
  required: ["difficultyScore", "requiredSkills", "keywords", "quickMatchEstimate"],
  additionalProperties: false,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobDescription, resumeText } = req.body;

  if (!jobDescription || jobDescription.trim().length < 50) {
    return res.status(400).json({ error: "Job description is required." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    const ip = getClientIp(req);
    const { allowed } = await checkAndIncrementRateLimit(ip, {
      collection: "scanJdPreviewRateLimits",
      limit: DAILY_IP_LIMIT,
    });

    if (!allowed) {
      return res.status(429).json({ error: "Too many requests. Try again tomorrow." });
    }
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }

  const hasResume = resumeText && resumeText.trim().length >= 50;

  const systemPrompt = `You are an expert recruiter and ATS analyst. Quickly scan the job description on its own. difficultyScore (0-100) reflects how competitive/demanding the role is: seniority, required years, breadth of skills. requiredSkills is up to 8 of the most important hard requirements. keywords is up to 12 exact terms an ATS would scan for, taken verbatim from the job description. ${
    hasResume
      ? "quickMatchEstimate is a number 0-100, a rough estimate of how well the provided resume matches this JD."
      : "Set quickMatchEstimate to null since no resume was provided."
  } Be fast and concise.`;

  const userPrompt = `JOB DESCRIPTION:\n${jobDescription}${
    hasResume
      ? `\n\nCANDIDATE RESUME (for a rough, quick match estimate only — not a full analysis):\n${resumeText}`
      : ""
  }`;

  try {
    const { result } = await callGroqJSON({
      apiKey,
      systemPrompt,
      userPrompt,
      schemaName: "jd_preview",
      schema: SCHEMA,
      temperature: 0.2,
      maxTokens: 1024,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Groq error:", err);
    return res.status(500).json({ error: "Failed to preview job description." });
  }
}
