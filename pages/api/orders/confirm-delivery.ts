// pages/api/orders/confirm-delivery.ts
// ─── BUYER CONFIRMS DELIVERY → RELEASE FUNDS ─────────────────────
// The moment a buyer confirms delivery, this both marks the order
// completed AND sends the seller's 90% cut to their Stripe Connect
// account. Your platform fee simply stays in your main balance —
// nothing to transfer for that part.

import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { orderId, buyerId } = req.body;
  if (!orderId || !buyerId) return res.status(400).json({ error: "Missing fields" });

  try {
    const orderRef  = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

    const order = orderSnap.data()!;

    // Security: only buyer can confirm
    if (order.buyerId !== buyerId) return res.status(403).json({ error: "Unauthorized" });
    if (order.escrowStatus !== "shipped") {
      return res.status(400).json({ error: "Order must be shipped before confirming delivery" });
    }

    // ── Pay the seller via Stripe Connect ───────────────────────
    // Only attempt this once — if payoutStatus is already "paid",
    // skip straight to marking delivery confirmed.
    let transferId: string | null = null;
    if (order.payoutStatus !== "paid") {
      if (!order.sellerStripeAccountId) {
        return res.status(400).json({ error: "No payout account on file for this seller — contact support" });
      }
      if (!order.sellerPayout || order.sellerPayout <= 0) {
        return res.status(400).json({ error: "Nothing to pay out on this order" });
      }

      const transfer = await stripe.transfers.create({
        amount:         Math.round(order.sellerPayout * 100), // cents
        currency:       (order.currency || "CAD").toLowerCase(),
        destination:    order.sellerStripeAccountId,
        transfer_group: orderId,
        metadata:       { orderId, sellerId: order.sellerId },
      });
      transferId = transfer.id;
    }

    // Mark delivered + completed → funds released to seller
    await orderRef.update({
      escrowStatus:     "completed",
      deliveredAt:      new Date(),
      payoutStatus:     "paid",
      ...(transferId ? { stripeTransferId: transferId } : {}),
      updatedAt:        new Date(),
    });

    // Notify seller
    await adminDb.collection("notifications").doc(order.sellerId)
      .collection("items").add({
        userId:    order.sellerId,
        type:      "payment",
        title:     "💰 Payment Released!",
        body:      `${order.buyerName} confirmed delivery of ${order.productName}. CA$${order.sellerPayout} has been sent to your bank account.`,
        link:      `/seller/dashboard`,
        read:      false,
        createdAt: new Date(),
      });

    // Notify buyer
    await adminDb.collection("notifications").doc(order.buyerId)
      .collection("items").add({
        userId:    order.buyerId,
        type:      "system",
        title:     "✅ Delivery Confirmed",
        body:      `You confirmed receipt of ${order.productName}. Thank you!`,
        link:      `/orders/${orderId}`,
        read:      false,
        createdAt: new Date(),
      });

    return res.status(200).json({ success: true, transferId });
  } catch (err: any) {
    console.error("Confirm delivery error:", err);
    return res.status(500).json({ error: err.message });
  }
}
