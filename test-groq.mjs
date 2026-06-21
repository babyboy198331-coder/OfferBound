// Temporary local test script — exercises the Groq helper directly
// (bypassing Firestore rate-limiting, which has its own unrelated
// node_modules issue) against the real Groq API.
// Run: node --env-file=.env.local test-groq.mjs
// Delete this file when done testing.

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
  // 1. Structured JSON call (preview-resume schema)
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

  console.log("\n=== Testing callGroqJSON (preview-resume schema) ===");
  const { result, finishReason } = await callGroqJSON({
    apiKey,
    systemPrompt:
      "You are an expert resume reviewer. Quickly scan the resume. qualityScore (0-100). headline is one short sentence. roleTypes up to 3 likely job titles. topSkills up to 10 skills from the resume.",
    userPrompt: `RESUME:\n${resumeText}`,
    schemaName: "resume_preview",
    schema: previewSchema,
    temperature: 0.2,
    maxTokens: 1024,
  });
  console.log("finishReason:", finishReason);
  console.log(JSON.stringify(result, null, 2));

  // 2. Conditional nullable field schema (preview-jd, no resume)
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

  console.log("\n=== Testing callGroqJSON (preview-jd, no resume -> quickMatchEstimate should be null) ===");
  const { result: jdResult } = await callGroqJSON({
    apiKey,
    systemPrompt:
      "You are an expert recruiter. Scan the job description. difficultyScore 0-100. requiredSkills up to 8. keywords up to 12 exact terms. Set quickMatchEstimate to null since no resume was provided.",
    userPrompt: `JOB DESCRIPTION:\n${jobDescription}`,
    schemaName: "jd_preview",
    schema: jdSchema,
    temperature: 0.2,
    maxTokens: 1024,
  });
  console.log(JSON.stringify(jdResult, null, 2));

  // 3. Plain chat call (fix-chat)
  console.log("\n=== Testing callGroqChat (fix-chat style) ===");
  const { reply, finishReason: chatFinish } = await callGroqChat({
    apiKey,
    messages: [
      {
        role: "system",
        content:
          "You are an expert ATS resume coach. The candidate's resume is missing the keyword 'distributed systems'. Resume:\n" +
          resumeText +
          "\nJob description:\n" +
          jobDescription,
      },
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
