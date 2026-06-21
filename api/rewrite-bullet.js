import { getClientIp, checkAndIncrementRateLimit } from "./_lib/rateLimit.js";
import { callGroqJSON } from "./_lib/groq.js";

// Teaser feature: rewrite exactly ONE weak bullet from the resume, tailored
// to the job description, to demonstrate what the full Pro AI rewrite does.
// Available to free and Pro users alike — it's meant to sell the full
// rewrite (Phase 3), not be gated itself. Cheap, single-bullet output, so a
// generous per-IP ceiling is fine.
const DAILY_IP_LIMIT = 120;

const SCHEMA = {
  type: "object",
  properties: {
    originalBullet: { type: "string" },
    rewrittenBullet: { type: "string" },
    reason: { type: "string" },
  },
  required: ["originalBullet", "rewrittenBullet", "reason"],
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
      collection: "scanBulletRewriteRateLimits",
      limit: DAILY_IP_LIMIT,
    });

    if (!allowed) {
      return res.status(429).json({ error: "Too many requests. Try again tomorrow." });
    }
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }

  const systemPrompt = `You are an expert resume writer. Find the SINGLE weakest bullet point in the resume — vague, no metrics, passive language, or low relevance to the job description — and rewrite just that one bullet to be strong, quantified, and tailored to the job description. Pick only ONE bullet — the one with the most room for improvement. Keep the rewrite truthful to the original content (don't invent facts), just sharpen wording, add structure, and quantify impact where plausible.`;

  const userPrompt = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  try {
    const { result } = await callGroqJSON({
      apiKey,
      systemPrompt,
      userPrompt,
      schemaName: "bullet_rewrite",
      schema: SCHEMA,
      temperature: 0.3,
      maxTokens: 1024,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Groq error:", err);
    return res.status(500).json({ error: "Failed to generate rewrite example." });
  }
}
