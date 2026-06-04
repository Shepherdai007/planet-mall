// pages/api/escrow/open-dispute.ts
// ─── BUYER OPENS DISPUTE → FREEZE ESCROW ────────────────────────
// Called when buyer has a problem before confirming delivery.
// Freezes payment — seller cannot receive it until resolved.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { orderId, buyerId, reason, description } = req.body;
  if (!orderId || !buyerId || !reason) {
    return res.status(400).json({ error: "orderId, buyerId, and reason required" });
  }

  try {
    const orderRef  = adminDb.doc(`orders/${orderId}`);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) return res.status(404).json({ error: "Order not found" });
    const order = orderSnap.data()!;

    if (order.buyerId !== buyerId) return res.status(403).json({ error: "Not authorized" });
    if (order.escrowStatus === "released") return res.status(400).json({ error: "Payment already released — contact support" });
    if (order.escrowStatus === "disputed") return res.status(400).json({ error: "Dispute already open" });

    const now = new Date();

    // Create dispute record
    const disputeRef = await adminDb.collection("disputes").add({
      orderId,
      buyerId,
      sellerId:    order.sellerId || order.shopId,
      shopId:      order.shopId,
      reason,
      description: description || "",
      status:      "open",      // open → under_review → resolved_buyer → resolved_seller → dismissed
      resolution:  null,
      createdAt:   now,
      updatedAt:   now,
    });

    // Freeze the order
    await orderRef.update({
      escrowStatus: "disputed",
      disputeId:    disputeRef.id,
      disputeOpenedAt: now,
      updatedAt:    now,
    });

    // Notify Planet Mall admin (use a dedicated admin UID in production)
    await adminDb.collection("admin_alerts").add({
      type:      "dispute",
      disputeId: disputeRef.id,
      orderId,
      buyerId,
      reason,
      createdAt: now,
    });

    // Notify seller their payment is frozen
    await adminDb.collection("notifications").doc(order.sellerId || order.shopId).collection("items").add({
      type:      "system",
      title:     "⚠️ Payment frozen — dispute opened",
      body:      `A buyer has opened a dispute on order #${orderId.slice(0,8).toUpperCase()}. Payment is frozen pending review.`,
      link:      `/seller/orders`,
      read:      false,
      createdAt: now,
    });

    return res.status(200).json({ disputeId: disputeRef.id });
  } catch (err: any) {
    console.error("Open dispute error:", err);
    return res.status(500).json({ error: err.message });
  }
}
