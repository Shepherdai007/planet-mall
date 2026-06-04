// pages/api/stripe/webhook.ts
// ─── STRIPE WEBHOOK HANDLER ──────────────────────────────────────
// Listens for Stripe events and updates Firestore subscriptions.
// Must disable bodyParser — Stripe needs raw body for signature verification.
// Set STRIPE_WEBHOOK_SECRET in .env.local after running:
//   stripe listen --forward-to localhost:3000/api/stripe/webhook

import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const sig     = req.headers["stripe-signature"] as string;
  const secret  = process.env.STRIPE_WEBHOOK_SECRET!;
  const rawBody = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── Handle events ─────────────────────────────────────────────
  switch (event.type) {

    case "checkout.session.completed": {
      const session  = event.data.object as any;
      const userId   = session.metadata?.userId;
      const plan     = session.metadata?.plan;
      const subId    = session.subscription;
      if (!userId || !plan) break;

      await adminDb.doc(`subscriptions/${userId}`).set({
        uid:                    userId,
        plan,
        status:                 "active",
        stripeCustomerId:       session.customer,
        stripeSubscriptionId:   subId,
        paymentMethod:          "stripe",
        currentPeriodStart:     new Date(),
        currentPeriodEnd:       null,
        cancelAtPeriodEnd:      false,
        updatedAt:              new Date(),
      }, { merge: true });
      break;
    }

    case "customer.subscription.updated": {
      const sub    = event.data.object as any;
      const userId = await getUserIdFromCustomer(sub.customer);
      if (!userId) break;

      await adminDb.doc(`subscriptions/${userId}`).update({
        status:            sub.status === "active" ? "active" : "cancelled",
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodEnd:  new Date(sub.current_period_end * 1000),
        updatedAt:         new Date(),
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub    = event.data.object as any;
      const userId = await getUserIdFromCustomer(sub.customer);
      if (!userId) break;

      await adminDb.doc(`subscriptions/${userId}`).update({
        plan:      "free",
        status:    "cancelled",
        updatedAt: new Date(),
      });
      break;
    }
  }

  return res.status(200).json({ received: true });
}

// Helper — look up userId by Stripe customer ID
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const snap = await adminDb
    .collection("subscriptions")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}
