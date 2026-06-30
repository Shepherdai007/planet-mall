// pages/api/orders/dispute.ts
// ─── BUYER OPENS DISPUTE ──────────────────────────────────────────
// Freezes the order. Planet Mall admin reviews and decides.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { orderId, buyerId, reason } = req.body;
  if (!orderId || !buyerId || !reason) return res.status(400).json({ error: "Missing fields" });

  try {
    const orderRef  = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

    const order = orderSnap.data()!;

    if (order.buyerId !== buyerId) return res.status(403).json({ error: "Unauthorized" });
    if (!["paid_held", "shipped"].includes(order.escrowStatus)) {
      return res.status(400).json({ error: "Cannot dispute this order" });
    }

    await orderRef.update({
      escrowStatus:    "disputed",
      disputeReason:   reason,
      disputeOpenedAt: new Date(),
      updatedAt:       new Date(),
    });

    // Notify seller
    await adminDb.collection("notifications").doc(order.sellerId)
      .collection("items").add({
        userId:    order.sellerId,
        type:      "system",
        title:     "⚠️ Dispute Opened",
        body:      `${order.buyerName} opened a dispute on order #${orderId.slice(-6).toUpperCase()}. Reason: ${reason}`,
        link:      `/seller/dashboard`,
        read:      false,
        createdAt: new Date(),
      });

    // Notify Planet Mall admin
    await adminDb.collection("adminAlerts").add({
      type:      "dispute",
      orderId,
      buyerId,
      sellerId:  order.sellerId,
      reason,
      amount:    order.totalAmount,
      createdAt: new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
