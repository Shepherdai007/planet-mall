// pages/api/orders/mark-shipped.ts
// ─── SELLER MARKS ORDER AS SHIPPED ───────────────────────────────

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { orderId, sellerId, trackingNumber } = req.body;
  if (!orderId || !sellerId) return res.status(400).json({ error: "Missing fields" });

  try {
    const orderRef  = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });

    const order = orderSnap.data()!;

    if (order.sellerId !== sellerId) return res.status(403).json({ error: "Unauthorized" });
    if (order.escrowStatus !== "paid_held") {
      return res.status(400).json({ error: "Order is not in correct state" });
    }

    await orderRef.update({
      escrowStatus:   "shipped",
      trackingNumber: trackingNumber || "",
      shippedAt:      new Date(),
      updatedAt:      new Date(),
    });

    // Notify buyer
    await adminDb.collection("notifications").doc(order.buyerId)
      .collection("items").add({
        userId:    order.buyerId,
        type:      "new_order",
        title:     "🚚 Your order has been shipped!",
        body:      `${order.sellerName} shipped your ${order.productName}.${trackingNumber ? ` Tracking: ${trackingNumber}` : ""} Please confirm when received.`,
        link:      `/orders/${orderId}`,
        read:      false,
        createdAt: new Date(),
      });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
