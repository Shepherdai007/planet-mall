// pages/api/orders/confirm-delivery.ts
// ─── BUYER CONFIRMS DELIVERY → RELEASE FUNDS ─────────────────────

import type { NextApiRequest, NextApiResponse } from "next";
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

    // Mark delivered + completed → funds released to seller
    await orderRef.update({
      escrowStatus: "completed",
      deliveredAt:  new Date(),
      updatedAt:    new Date(),
    });

    // Notify seller
    await adminDb.collection("notifications").doc(order.sellerId)
      .collection("items").add({
        userId:    order.sellerId,
        type:      "payment",
        title:     "💰 Payment Released!",
        body:      `${order.buyerName} confirmed delivery of ${order.productName}. CA$${order.sellerPayout} will be sent to you.`,
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

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
