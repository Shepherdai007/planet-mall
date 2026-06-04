// pages/api/ai/insights.ts
// ─── AI BUSINESS INSIGHTS ────────────────────────────────────────
// Generates a plain-English weekly business report for sellers.
// Premium feature. Takes shop stats and returns actionable insights.

import type { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { shopName, stats } = req.body;
  if (!shopName || !stats) return res.status(400).json({ error: "shopName and stats required" });

  const systemPrompt = `You are a friendly business advisor for small e-commerce sellers. 
Write a concise weekly insights report in plain English — no jargon, no fluff.
Format: 3-4 short bullet points. Each bullet is one clear, actionable insight.
Be encouraging but honest. Focus on what the seller can actually do.
Respond with ONLY the bullet points — no intro, no conclusion, no headers.`;

  const userPrompt = `Shop: ${shopName}
Weekly stats:
- Total revenue: CA$${stats.revenue || 0}
- Orders this week: ${stats.orders || 0}
- New products added: ${stats.newProducts || 0}
- Total products: ${stats.totalProducts || 0}
- Live products: ${stats.liveProducts || 0}
- Top product: ${stats.topProduct || "None"}
- Store followers: ${stats.followers || 0}
- Livestreams done: ${stats.streams || 0}

Generate 3-4 actionable insights for this seller.`;

  try {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 300,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return res.status(200).json({ insights: text });
  } catch (err: any) {
    console.error("Insights error:", err);
    return res.status(500).json({ error: "AI unavailable" });
  }
}
