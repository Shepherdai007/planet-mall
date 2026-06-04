// pages/api/escrow/auto-release.ts
// ─── AUTO-RELEASE AFTER 14 DAYS ─────────────────────────────────
// Called by a cron job (Vercel cron or external scheduler).
// Releases payments for orders shipped 14+ days ago with no dispute.
// Set up in vercel.json as a scheduled function.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Protect this endpoint — only callable by cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now        = new Date();
  // Standard: 14 days, Food: 2 hours
    const cutoffStandard = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const cutoffFood     = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const cutoff = cutoffStandard; // default // 14 days ago

  try {
    // Find all shipped orders older than 14 days with escrow still "held"
    const snap = await adminDb.collection("orders")
      .where("status", "in", ["shipped", "confirmed"])
      .where("escrowStatus", "==", "held")
      .get();

    const toRelease = snap.docs.filter(doc => {
      const data = doc.data();
      const shippedAt = data.shippedAt?.toDate?.() || data.createdAt?.toDate?.();
      return shippedAt && shippedAt < cutoff;
    });

    let released = 0;
    for (const doc of toRelease) {
      const order = doc.data();
      await doc.ref.update({
        status:           "delivered",
        escrowStatus:     "released",
        escrowReleasedAt: now,
        autoReleased:     true,
        updatedAt:        now,
      });

      // Notify seller
      await adminDb.collection("notifications")
        .doc(order.sellerId || order.shopId)
        .collection("items").add({
          type:      "payment",
          title:     "Payment auto-released 💰",
          body:      `Payment for order #${doc.id.slice(0,8).toUpperCase()} was automatically released after 14 days.`,
          link:      `/seller/orders`,
          read:      false,
          createdAt: now,
        });

      released++;
    }

    return res.status(200).json({ released, checked: snap.docs.length });
  } catch (err: any) {
    console.error("Auto-release error:", err);
    return res.status(500).json({ error: err.message });
  }
}
