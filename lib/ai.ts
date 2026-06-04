// lib/ai.ts
// ─── CLAUDE API WRAPPER ─────────────────────────────────────────
// ALL Claude calls must go through this file.
// Never call Anthropic directly from components or pages.
// Always check isPremium() before calling these functions.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Text response ────────────────────────────────────────────────
export async function callClaude(
  prompt: string,
  systemPrompt: string,
  maxTokens: number = 1000
): Promise<string> {
  const response = await client.messages.create({
    model:      "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system:     systemPrompt,
    messages:   [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

// ── JSON response ────────────────────────────────────────────────
// Appends "Respond ONLY with valid JSON" to the system prompt.
// Strips markdown fences before parsing.
export async function callClaudeJSON<T = unknown>(
  prompt: string,
  systemPrompt: string,
  maxTokens: number = 1000
): Promise<T> {
  const jsonSystemPrompt =
    systemPrompt +
    "\n\nRespond ONLY with valid JSON. No markdown, no explanation, no code fences.";

  const text = await callClaude(prompt, jsonSystemPrompt, maxTokens);

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean) as T;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${text.slice(0, 200)}`);
  }
}
