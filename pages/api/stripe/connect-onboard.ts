// pages/api/stripe/connect-onboard.ts
// ─── START/CONTINUE STRIPE CONNECT EXPRESS ONBOARDING ───────────
// Called from the seller dashboard "Connect payout account" button.
// Creates a Stripe Express account for the shop (if one doesn't exist
// yet), then returns a one-time onboarding link for the seller to
// complete on Stripe's own hosted page.
//
// The account's country is pulled from the seller's shop profile
// (shop.country) instead of being hardcoded, so sellers outside
// Canada — e.g. Ghana, Nigeria, Kenya, South Africa — onboard with
// the correct country from the start. Stripe Express is supported
// in these countries, but each requires its own country code on
// account creation or onboarding will show the wrong local bank
// fields and can fail.

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

// Map the country names used in Planet Mall's shop-creation wizard
// (see pages/seller/create-shop.tsx COUNTRIES list) to the ISO-3166
// alpha-2 codes Stripe's Accounts API requires. Only countries Stripe
// Connect actually supports for Express accounts are listed here —
// if a seller's shop country isn't in this map, we fall back to "CA"
// and log a warning rather than silently creating a broken account.
const COUNTRY_TO_ISO: Record<string, string> = {
  "Canada":        "CA",
  "United States": "US",
  "United Kingdom":"GB",
  "Australia":     "AU",
  "Germany":       "DE",
  "France":        "FR",
  "Netherlands":   "NL",
  "Sweden":        "SE",
  "Japan":         "JP",
  "Singapore":     "SG",
  "UAE":           "AE",
  "South Africa":  "ZA",
  "Nigeria":       "NG",
  "Ghana":         "GH",
  "Kenya":         "KE",
  "India":         "IN",
  "Brazil":        "BR",
};

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
      const isoCountry = COUNTRY_TO_ISO[shop.country] || "CA";
      if (!COUNTRY_TO_ISO[shop.country]) {
        console.warn(`Stripe Connect: unrecognized shop country "${shop.country}" for shop ${shopId} — defaulting to CA. Add it to COUNTRY_TO_ISO if Stripe supports it.`);
      }

      const account = await stripe.accounts.create({
        type: "express",
        country: isoCountry,
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
