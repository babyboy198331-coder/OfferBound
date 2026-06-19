import { getClientIp, checkAndIncrementRateLimit } from "./_lib/rateLimit.js";

// Lightweight, cheap call (small output, low token budget) so we can afford
// a much more generous per-IP ceiling than the full /api/analyze endpoint.
// This does NOT count against the user's free/Pro scan limit — it's just
// instant feedback while they're still filling out the form.
const DAILY_IP_LIMIT = 300;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobDescription, resumeText } = req.body;

  if (!jobDescription || jobDescription.trim().length < 50) {
    return res.status(400).json({ error: "Job description is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
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

  const prompt = `
You are an expert recruiter and ATS analyst. Quickly scan this job description on its own and return structured JSON only — no markdown, no explanation, just raw JSON.

JOB DESCRIPTION:
${jobDescription}
${hasResume ? `\nCANDIDATE RESUME (for a rough, quick match estimate only — not a full analysis):\n${resumeText}` : ""}

Return this exact JSON structure:
{
  "difficultyScore": <number 0-100, how competitive/demanding this role is: seniority, required years, breadth of skills>,
  "requiredSkills": ["<skill1>", "<skill2>", ...up to 8, the most important hard requirements],
  "keywords": ["<keyword1>", "<keyword2>", ...up to 12, exact terms an ATS would scan for],
  "quickMatchEstimate": ${hasResume ? "<number 0-100, rough estimate of how well the resume matches this JD>" : "null"}
}

Be fast and concise. Use exact terms from the job description for keywords.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini error:", err);
      return res.status(500).json({ error: "Failed to preview job description." });
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const raw = candidate?.content?.parts?.[0]?.text || "";

    if (!raw) {
      return res.status(500).json({ error: "Failed to preview job description." });
    }

    const clean = raw.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch (parseErr) {
      console.error("JSON parse failed for preview-jd:", parseErr, "raw:", raw);
      return res.status(500).json({ error: "Failed to preview job description." });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
