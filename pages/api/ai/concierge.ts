// pages/api/ai/concierge.ts
// ─── PLANET MALL AI CONCIERGE ────────────────────────────────────
// Powers the floating assistant bubble.
// Claude knows the platform, helps buyers find products,
// guides sellers, answers questions about orders/shipping/returns.
// Restricted to Premium and Business users only.

import type { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/firebase-admin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Planet Mall AI Concierge — a friendly, knowledgeable shopping assistant built into Planet Mall, a global e-commerce platform.

Your role:
- Help buyers find products, compare options, understand shipping and returns
- Guide new users through the platform (how to shop, how to open a store, how livestreams work)
- Help sellers understand their dashboard, products, and analytics
- Answer questions about orders, payments, and policies
- Be warm, concise, and genuinely helpful

Platform facts:
- Planet Mall is a global marketplace — sellers from anywhere, buyers from anywhere
- All prices are in CAD (Canadian dollars)
- Payments via Stripe (all major cards)
- Sellers can go live and sell via livestream
- Free tier: up to 10 products, basic analytics
- Premium: CA$8/month — unlimited products, AI features, 1 livestream, custom domain
- Business: CA$10/month — everything + unlimited livestreams, API access, bulk import, team permissions
- Buyers can message sellers directly
- Sellers get AI-powered store builder, product descriptions, and weekly insights on Premium

Rules:
- Keep responses SHORT — 2-4 sentences max unless the user asks for detail
- Never make up product prices or availability — you don't have live inventory access
- If asked about a specific order, tell them to check their Orders page
- Always be encouraging and positive about the platform
- Respond in the same language the user writes in`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages, userId } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  // ── Check subscription — Premium & Business only ──────────────
  if (!userId) {
    return res.status(403).json({ error: "upgrade", message: "Sign in to use the AI Concierge." });
  }

  try {
    // Check both users doc and subscriptions collection
    const [userDoc, subDoc] = await Promise.all([
      adminDb.collection("users").doc(userId).get(),
      adminDb.collection("subscriptions").doc(userId).get(),
    ]);
    const userData = userDoc.data();
    const subData  = subDoc.data();
    const plan = subData?.plan || userData?.subscription || userData?.plan || "free";
    const subStatus = subData?.status || "free";
    const isPaid = (plan === "premium" || plan === "business") && subStatus === "active";

    if (!isPaid) {
      return res.status(403).json({
        error: "upgrade",
        message: "The AI Concierge is available on Premium (CA$8/month) and Business plans. Upgrade to unlock it!",
      });
    }
  } catch (err) {
    console.error("Auth check error:", err);
    return res.status(500).json({ error: "Auth check failed" });
  }

  try {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 400,
      system:     SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return res.status(200).json({ text });
  } catch (err: any) {
    console.error("Concierge error:", err);
    return res.status(500).json({ error: "AI unavailable" });
  }
}
