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
    qualityScore: { type: "number" },
    headline: { type: "string" },
    roleTypes: { type: "array", items: { type: "string" } },
    topSkills: { type: "array", items: { type: "string" } },
  },
  required: ["qualityScore", "headline", "roleTypes", "topSkills"],
  additionalProperties: false,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeText } = req.body;

  if (!resumeText || resumeText.trim().length < 50) {
    return res.status(400).json({ error: "Resume text is required." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    const ip = getClientIp(req);
    const { allowed } = await checkAndIncrementRateLimit(ip, {
      collection: "scanPreviewRateLimits",
      limit: DAILY_IP_LIMIT,
    });

    if (!allowed) {
      return res.status(429).json({ error: "Too many requests. Try again tomorrow." });
    }
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }

  const systemPrompt = `You are an expert resume reviewer. Quickly scan the resume on its own (no job description yet). qualityScore (0-100) reflects general resume strength: clarity, quantified impact, structure. headline is one short sentence, e.g. "Mid-level frontend engineer with strong React background". roleTypes is up to 3 likely job titles. topSkills is up to 10 specific technical/professional skills extracted directly from the resume text. Be fast and concise.`;

  const userPrompt = `RESUME:\n${resumeText}`;

  try {
    const { result } = await callGroqJSON({
      apiKey,
      systemPrompt,
      userPrompt,
      schemaName: "resume_preview",
      schema: SCHEMA,
      temperature: 0.2,
      maxTokens: 1024,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Groq error:", err);
    return res.status(500).json({ error: "Failed to preview resume." });
  }
}
