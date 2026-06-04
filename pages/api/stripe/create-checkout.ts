// pages/api/stripe/create-checkout.ts
// ─── CREATE STRIPE CHECKOUT SESSION ─────────────────────────────
// Creates a Stripe Checkout session for subscription plans.
// Returns a URL to redirect the buyer to Stripe hosted checkout.

import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { plan, userId, email } = req.body;
  if (!plan || !userId || !email) {
    return res.status(400).json({ error: "plan, userId, and email required" });
  }

  const PLANS: Record<string, { amount: number; interval: "month" | "year"; name: string; planName: string }> = {
    premium_monthly:  { amount: 1499,  interval: "month", name: "Planet Mall Premium",         planName: "premium" },
    premium_yearly:   { amount: 12900, interval: "year",  name: "Planet Mall Premium (Yearly)", planName: "premium" },
    business_monthly: { amount: 3999, interval: "month", name: "Planet Mall Business",         planName: "business" },
  };

  const selected = PLANS[plan];
  if (!selected) return res.status(400).json({ error: "Invalid plan" });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                 "subscription",
      payment_method_types: ["card"],
      customer_email:       email,
      line_items: [{
        price_data: {
          currency:     "cad",
          product_data: { name: selected.name },
          unit_amount:  selected.amount,
          recurring:    { interval: selected.interval },
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${selected.planName}&uid=${userId}`,
      cancel_url:  `${appUrl}/pricing`,
      metadata:    { userId, plan: selected.planName },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
