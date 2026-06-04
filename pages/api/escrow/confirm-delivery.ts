// pages/api/escrow/confirm-delivery.ts
// ─── BUYER CONFIRMS DELIVERY → RELEASE PAYMENT TO SELLER ────────
// Called when buyer clicks "I received my item".
// Updates order status to "delivered" and marks escrow as released.
// In production: trigger Stripe payout to seller here.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { orderId, buyerId } = req.body;
  if (!orderId || !buyerId) return res.status(400).json({ error: "orderId and buyerId required" });

  try {
    const orderRef  = adminDb.doc(`orders/${orderId}`);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

    const order = orderSnap.data()!;

    // Security: only the buyer can confirm their own delivery
    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Only shipped orders can be confirmed
    if (!["shipped", "confirmed"].includes(order.status)) {
      return res.status(400).json({ error: "Order is not in a shippable state" });
    }

    const now = new Date();

    await orderRef.update({
      status:            "delivered",
      escrowStatus:      "released",
      deliveryConfirmedAt: now,
      escrowReleasedAt:  now,
      updatedAt:         now,
    });

    // TODO (production): trigger Stripe payout to seller
    // const commission = order.total * getCommissionRate(sellerPlan);
    // const sellerPayout = order.total - commission;
    // await stripe.transfers.create({ amount: sellerPayout * 100, currency: "cad", destination: seller.stripeAccountId });

    // Notify seller
    await adminDb.collection("notifications").doc(order.sellerId || order.shopId).collection("items").add({
      userId:    order.sellerId || order.shopId,
      type:      "payment",
      title:     "Payment released! 💰",
      body:      `Buyer confirmed delivery for order #${orderId.slice(0,8).toUpperCase()}. Payment has been released.`,
      link:      `/seller/orders`,
      read:      false,
      createdAt: now,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Confirm delivery error:", err);
    return res.status(500).json({ error: err.message });
  }
}
