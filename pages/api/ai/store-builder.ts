// pages/api/ai/store-builder.ts
// ─── AI STORE BUILDER ────────────────────────────────────────────
// Seller describes their business in plain English.
// Claude generates: name, tagline, description, category,
// brand colors, mood, return policy, shipping note.
// Premium feature only — check subscription server-side.

import type { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const systemPrompt = `You are an expert e-commerce brand builder. Given a brief description of a business, generate a complete store profile.

Respond ONLY with valid JSON — no markdown, no explanation, no code fences.

JSON structure:
{
  "name": "Store name (2-4 words, memorable, brandable)",
  "tagline": "One compelling sentence about what they sell (max 80 chars)",
  "description": "2-3 sentences about the store for buyers (max 300 chars)",
  "category": "One of: Fashion & Apparel, Electronics, Home & Living, Beauty & Health, Food & Beverages, Sports & Outdoors, Art & Crafts, Books & Media, Toys & Games, Digital Products, Other",
  "mood": "One of: minimal, bold, warm, luxury",
  "brandColor": "A hex color that fits the brand (e.g. #2C3E50)",
  "accentColor": "A complementary accent hex color",
  "returnPolicy": "A friendly return policy sentence",
  "shippingNote": "A shipping timeframe sentence mentioning CAD for free shipping threshold",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 600,
      system:     systemPrompt,
      messages:   [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const data  = JSON.parse(clean);
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Store builder error:", err);
    return res.status(500).json({ error: "AI unavailable" });
  }
}
