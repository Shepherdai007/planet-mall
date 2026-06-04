// lib/stripe.ts
// ─── STRIPE SERVER-SIDE CLIENT ───────────────────────────────────
// NEVER import this in pages/ or components/ directly.
// Only use inside /pages/api/ routes.

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

// ── Price IDs ────────────────────────────────────────────────────
// These are created once in Stripe dashboard or via API.
// We create them dynamically in the webhook setup.
export const PRICES = {
  premium_monthly:  process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID  || "",
  premium_yearly:   process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID   || "",
  business_monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "",
};

// ── Plan amounts in cents CAD ─────────────────────────────────────
export const PLAN_PRICES = {
  premium_monthly:  999,   // CA$9.99
  premium_yearly:   8900,  // CA$89.00
  business_monthly: 2999,  // CA$29.99
};
