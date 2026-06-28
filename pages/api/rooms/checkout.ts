// pages/api/rooms/checkout.ts
// ─── STRIPE CHECKOUT FOR ROOM MEMBERSHIP ─────────────────────────

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { roomId, roomName, price, currency, userId, userName, userPhoto } = req.body;

  if (!roomId || !price || price <= 0) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency:     (currency || "cad").toLowerCase(),
          product_data: { name: `${roomName} — 30 Day Access` },
          unit_amount:  Math.round(price * 100),
        },
        quantity: 1,
      }],
      metadata: { roomId, userId, userName, userPhoto },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/rooms/${roomId}?joined=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/rooms/${roomId}`,
    });

    res.json({ url: session.url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
