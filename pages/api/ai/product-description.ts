// pages/api/ai/product-description.ts
// ─── AI PRODUCT DESCRIPTION GENERATOR ───────────────────────────
// Seller provides product name + optional details.
// Claude writes a compelling product description.

import type { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { productName, category, price, details } = req.body;
  if (!productName) return res.status(400).json({ error: "productName required" });

  const systemPrompt = `You are an expert e-commerce copywriter. Write compelling, honest product descriptions that convert browsers into buyers.

Rules:
- 2-3 sentences max (under 200 characters total)
- Lead with the key benefit, not features
- Sound human, not robotic
- No emojis, no ALL CAPS
- Mention the category context naturally
- Do NOT mention price
- Respond with ONLY the description text — no quotes, no labels`;

  const userPrompt = `Product: ${productName}
Category: ${category || "General"}
${price ? `Price: CA$${price}` : ""}
${details ? `Additional details: ${details}` : ""}

Write a product description.`;

  try {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 150,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return res.status(200).json({ description: text });
  } catch (err: any) {
    console.error("Description error:", err);
    return res.status(500).json({ error: "AI unavailable" });
  }
}
