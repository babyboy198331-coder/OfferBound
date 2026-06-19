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

  const { resumeText } = req.body;

  if (!resumeText || resumeText.trim().length < 50) {
    return res.status(400).json({ error: "Resume text is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
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

  const prompt = `
You are an expert resume reviewer. Quickly scan this resume on its own (no job description yet) and return structured JSON only — no markdown, no explanation, just raw JSON.

RESUME:
${resumeText}

Return this exact JSON structure:
{
  "qualityScore": <number 0-100, general resume strength: clarity, quantified impact, structure>,
  "headline": "<one short sentence, e.g. 'Mid-level frontend engineer with strong React background'>",
  "roleTypes": ["<likely job title 1>", "<likely job title 2>", ...up to 3],
  "topSkills": ["<skill1>", "<skill2>", ...up to 10]
}

Be fast and concise. topSkills should be specific technical/professional skills extracted directly from the resume text.
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
      return res.status(500).json({ error: "Failed to preview resume." });
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const raw = candidate?.content?.parts?.[0]?.text || "";

    if (!raw) {
      return res.status(500).json({ error: "Failed to preview resume." });
    }

    const clean = raw.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch (parseErr) {
      console.error("JSON parse failed for preview-resume:", parseErr, "raw:", raw);
      return res.status(500).json({ error: "Failed to preview resume." });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
