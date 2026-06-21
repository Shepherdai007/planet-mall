// pages/api/stripe/create-onetime-checkout.ts
// ─── ONE-TIME PAYMENT CHECKOUT ───────────────────────────────────
// Separate from create-checkout.ts (subscriptions only).
// Used for: job posting fee (CA$5), AI resume builder (CA$2),
// classified listing boost (CA$0.99).

import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { product, userId, email, refId } = req.body;
  if (!product || !userId || !email) {
    return res.status(400).json({ error: "product, userId, and email required" });
  }

  const PRODUCTS: Record<string, { amount: number; name: string }> = {
    job_post:        { amount: 500,  name: "Planet Mall Job Posting (30 days)" },
    resume_builder:  { amount: 200,  name: "Planet Mall AI Resume Builder" },
    boost_listing:   { amount: 99,   name: "Planet Mall Listing Boost" },
  };

  const selected = PRODUCTS[product];
  if (!selected) return res.status(400).json({ error: "Invalid product" });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Success destination differs per product
  const successPaths: Record<string, string> = {
    job_post:       `/jobs/post/success?session_id={CHECKOUT_SESSION_ID}&uid=${userId}`,
    resume_builder: `/jobs/resume-builder/success?session_id={CHECKOUT_SESSION_ID}&uid=${userId}${refId ? `&jobId=${refId}` : ""}`,
    boost_listing:  `/classifieds/${refId}?boosted=true`,
  };
  const cancelPaths: Record<string, string> = {
    job_post:       "/jobs/post",
    resume_builder: "/jobs/resume-builder",
    boost_listing:  `/classifieds/${refId}`,
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      customer_email:       email,
      line_items: [{
        price_data: {
          currency:     "cad",
          product_data: { name: selected.name },
          unit_amount:  selected.amount,
        },
        quantity: 1,
      }],
      success_url: `${appUrl}${successPaths[product]}`,
      cancel_url:  `${appUrl}${cancelPaths[product]}`,
      metadata:    { userId, product, refId: refId || "" },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("One-time checkout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
