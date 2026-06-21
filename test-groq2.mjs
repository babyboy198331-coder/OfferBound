import { callGroqJSON, callGroqChat } from "./api/_lib/groq.js";

const apiKey = process.env.GROQ_API_KEY;
console.log("GROQ_API_KEY set:", !!apiKey);

const resumeText = `Jane Doe
Software Engineer

Experience:
- Worked on backend stuff at TechCorp for 3 years
- Helped improve performance of the API
- Wrote some tests

Skills: JavaScript, Node.js, React, SQL`;

const jobDescription = `We are looking for a Senior Backend Engineer with 5+ years of experience in Node.js, distributed systems, and PostgreSQL. Must have experience optimizing API latency and mentoring junior engineers. Strong communication skills required.`;

async function run() {
  const previewSchema = {
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

  console.log("\n=== callGroqJSON (preview-resume schema) ===");
  const { result, finishReason } = await callGroqJSON({
    apiKey,
    systemPrompt: "You are an expert resume reviewer. qualityScore 0-100. headline one sentence. roleTypes up to 3. topSkills up to 10.",
    userPrompt: `RESUME:\n${resumeText}`,
    schemaName: "resume_preview",
    schema: previewSchema,
    temperature: 0.2,
    maxTokens: 1024,
  });
  console.log("finishReason:", finishReason);
  console.log(JSON.stringify(result, null, 2));

  const jdSchema = {
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

  console.log("\n=== callGroqJSON (preview-jd, no resume -> null) ===");
  const { result: jdResult } = await callGroqJSON({
    apiKey,
    systemPrompt: "You are an expert recruiter. difficultyScore 0-100. requiredSkills up to 8. keywords up to 12. Set quickMatchEstimate to null since no resume was provided.",
    userPrompt: `JOB DESCRIPTION:\n${jobDescription}`,
    schemaName: "jd_preview",
    schema: jdSchema,
    temperature: 0.2,
    maxTokens: 1024,
  });
  console.log(JSON.stringify(jdResult, null, 2));

  console.log("\n=== callGroqChat (fix-chat style) ===");
  const { reply, finishReason: chatFinish } = await callGroqChat({
    apiKey,
    messages: [
      { role: "system", content: "You are an ATS resume coach. The resume is missing 'distributed systems'. Resume:\n" + resumeText + "\nJob description:\n" + jobDescription },
      { role: "user", content: "How do I work this into my resume?" },
    ],
    temperature: 0.4,
    maxTokens: 512,
  });
  console.log("finishReason:", chatFinish);
  console.log(reply);

  console.log("\nAll Groq calls succeeded.");
}

run().catch((err) => {
  console.error("Test script error:", err);
  process.exit(1);
});
