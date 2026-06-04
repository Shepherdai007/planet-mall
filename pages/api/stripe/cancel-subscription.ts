// pages/api/stripe/cancel-subscription.ts
// ─── CANCEL STRIPE SUBSCRIPTION ─────────────────────────────────
// Cancels at period end — user keeps Premium until billing date.

import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const snap = await adminDb.doc(`subscriptions/${userId}`).get();
    if (!snap.exists) return res.status(404).json({ error: "Subscription not found" });

    const data = snap.data()!;
    if (!data.stripeSubscriptionId) return res.status(400).json({ error: "No Stripe subscription" });

    // Cancel at period end — not immediately
    await stripe.subscriptions.update(data.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await adminDb.doc(`subscriptions/${userId}`).update({
      cancelAtPeriodEnd: true,
      updatedAt:         new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Cancel error:", err);
    return res.status(500).json({ error: err.message });
  }
}
