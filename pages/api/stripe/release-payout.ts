// pages/api/stripe/release-payout.ts
// ─── RELEASE ESCROW → PAY THE SELLER ─────────────────────────────
// Call this the moment an order's escrow is released (buyer confirms
// delivery, or your existing 2hr/48hr auto-release logic fires).
// Sends the seller's 85-90% cut to their Stripe Connect account.
// Your platform fee simply stays in your main Stripe balance —
// nothing to transfer for that part.

import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "orderId is required" });

  try {
    const orderRef  = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

    const order = orderSnap.data()!;

    // Don't pay twice
    if (order.payoutStatus === "paid") {
      return res.status(200).json({ alreadyPaid: true });
    }
    if (!order.sellerStripeAccountId) {
      return res.status(400).json({ error: "No Stripe account on file for this seller" });
    }
    if (!order.sellerPayout || order.sellerPayout <= 0) {
      return res.status(400).json({ error: "Nothing to pay out on this order" });
    }

    const transfer = await stripe.transfers.create({
      amount:      Math.round(order.sellerPayout * 100), // cents
      currency:    (order.currency || "CAD").toLowerCase(),
      destination: order.sellerStripeAccountId,
      transfer_group: orderId,
      metadata: { orderId, sellerId: order.sellerId },
    });

    await orderRef.update({
      payoutStatus:     "paid",
      stripeTransferId: transfer.id,
      updatedAt:        new Date(),
    });

    return res.status(200).json({ success: true, transferId: transfer.id });
  } catch (err: any) {
    console.error("Release payout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
