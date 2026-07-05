// pages/api/stripe/connect-status.ts
// ─── CHECK & SYNC STRIPE CONNECT ACCOUNT STATUS ──────────────────
// Called when the seller lands back on /seller/payouts after finishing
// (or abandoning) Stripe's onboarding flow. Pulls the latest status
// directly from Stripe and updates the shop doc in Firestore so
// `payoutsEnabled` always reflects reality.

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { shopId } = req.body;
  if (!shopId) return res.status(400).json({ error: "shopId is required" });

  try {
    const shopRef = adminDb.doc(`shops/${shopId}`);
    const shopSnap = await shopRef.get();
    if (!shopSnap.exists) return res.status(404).json({ error: "Shop not found" });

    const shop = shopSnap.data()!;
    if (!shop.stripeAccountId) {
      return res.status(200).json({ payoutsEnabled: false, detailsSubmitted: false });
    }

    const account = await stripe.accounts.retrieve(shop.stripeAccountId);

    const payoutsEnabled   = !!account.payouts_enabled;
    const detailsSubmitted = !!account.details_submitted;

    await shopRef.update({ payoutsEnabled, detailsSubmitted });

    return res.status(200).json({ payoutsEnabled, detailsSubmitted });
  } catch (err: any) {
    console.error("Stripe Connect status check error:", err);
    return res.status(500).json({ error: err.message });
  }
}
