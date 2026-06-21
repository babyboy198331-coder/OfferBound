import { getClientIp, checkAndIncrementRateLimit } from "./_lib/rateLimit.js";
import { callGroqJSON } from "./_lib/groq.js";

// Generous per-IP daily ceiling — this just guards the shared Groq key
// from abuse. The real free-vs-Pro scan limit is enforced client-side
// (see src/lib/scanLimit.js) against the signed-in user's account.
const DAILY_IP_LIMIT = 60;

const SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    summary: { type: "string" },
    matchedKeywords: { type: "array", items: { type: "string" } },
    missingKeywords: { type: "array", items: { type: "string" } },
    formatIssues: { type: "array", items: { type: "string" } },
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: [
    "score",
    "summary",
    "matchedKeywords",
    "missingKeywords",
    "formatIssues",
    "suggestions",
  ],
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
      collection: "scanAnalyzeRateLimits",
      limit: DAILY_IP_LIMIT,
    });

    if (!allowed) {
      return res.status(429).json({
        error: `Daily limit reached for resume scans from this network. Try again tomorrow.`,
      });
    }
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }

  const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst. Analyze the resume against the job description and return structured JSON only.

Scoring guide:
- 80-100: Strong match, likely to pass ATS
- 60-79: Moderate match, needs some improvement
- 40-59: Weak match, significant gaps
- 0-39: Poor match, major revisions needed

Be specific with keywords — use the exact terms from the job description.
Format issues should flag things like: missing sections, tables, graphics, unusual fonts, missing contact info, or lack of quantified achievements.
Suggestions should be actionable and specific to this resume/JD pair. Use up to 12 matchedKeywords, up to 12 missingKeywords, up to 6 formatIssues, and up to 6 suggestions.`;

  const userPrompt = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  try {
    const { result } = await callGroqJSON({
      apiKey,
      systemPrompt,
      userPrompt,
      schemaName: "resume_analysis",
      schema: SCHEMA,
      temperature: 0.2,
      maxTokens: 4096,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Groq error:", err);
    return res.status(500).json({ error: "Failed to analyze resume. Please try again." });
  }
}
