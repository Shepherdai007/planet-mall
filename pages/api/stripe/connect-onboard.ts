// pages/api/stripe/connect-onboard.ts
// ─── START/CONTINUE STRIPE CONNECT EXPRESS ONBOARDING ───────────
// Called from the seller dashboard "Connect payout account" button.
// Creates a Stripe Express account for the shop (if one doesn't exist
// yet), then returns a one-time onboarding link for the seller to
// complete on Stripe's own hosted page.

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { shopId, email } = req.body;
  if (!shopId) return res.status(400).json({ error: "shopId is required" });

  try {
    const shopRef = adminDb.doc(`shops/${shopId}`);
    const shopSnap = await shopRef.get();
    if (!shopSnap.exists) return res.status(404).json({ error: "Shop not found" });

    const shop = shopSnap.data()!;
    let accountId = shop.stripeAccountId as string | undefined;

    // Create the Express account once, reuse it on every future call
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "CA",
        email: email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
        business_type: "individual",
      });
      accountId = account.id;
      await shopRef.update({ stripeAccountId: accountId });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://planetmallshop.com";

    // One-time onboarding link — expires after a few minutes if unused
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/seller/payouts?refresh=1`,
      return_url:  `${appUrl}/seller/payouts?onboarded=1`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err: any) {
    console.error("Stripe Connect onboarding error:", err);
    return res.status(500).json({ error: err.message });
  }
}
