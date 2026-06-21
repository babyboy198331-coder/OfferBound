// Shared helper for calling Groq's OpenAI-compatible chat completions API.
// https://console.groq.com/docs/api-reference#chat-create

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// openai/gpt-oss-120b supports strict (constrained-decoding) Structured
// Outputs, so JSON responses are guaranteed to match the schema exactly —
// no markdown-fence stripping or parse retries needed.
export const GROQ_MODEL = "openai/gpt-oss-120b";

/**
 * Call Groq with a JSON Schema response format (strict mode).
 * Returns the parsed object directly.
 */
export async function callGroqJSON({
  apiKey,
  systemPrompt,
  userPrompt,
  schemaName,
  schema,
  temperature = 0.2,
  maxTokens = 2048,
}) {
  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_completion_tokens: maxTokens,
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const content = choice?.message?.content;
  const finishReason = choice?.finish_reason;

  if (!content) {
    throw new Error(`Groq returned no content. finish_reason: ${finishReason}`);
  }

  let result;
  try {
    result = JSON.parse(content);
  } catch (parseErr) {
    throw new Error(
      `Groq JSON parse failed. finish_reason: ${finishReason}, content: ${content}`
    );
  }

  return { result, finishReason };
}

/**
 * Call Groq for a plain conversational reply (no schema).
 * `messages` should already be in OpenAI role format: { role: "system" | "user" | "assistant", content }.
 */
export async function callGroqChat({ apiKey, messages, temperature = 0.4, maxTokens = 1024 }) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_completion_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const reply = choice?.message?.content?.trim();
  const finishReason = choice?.finish_reason;

  if (!reply) {
    throw new Error(`Groq returned no content. finish_reason: ${finishReason}`);
  }

  return { reply, finishReason };
}
