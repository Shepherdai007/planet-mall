// pages/api/orders/auto-release-delivery.ts
// ─── AUTO-RELEASE ESCROW AFTER 14 DAYS ───────────────────────────
// Safety net for buyers who never click "Confirm Delivery" after an
// order ships. Without this, a shipped order with an unresponsive
// buyer would sit in escrow forever and the seller would never get
// paid — even though they did everything right.
//
// Runs daily via Vercel Cron (see vercel.json). For every order that
// has been "shipped" for 14+ days with no dispute opened, this pays
// the seller automatically, exactly like confirm-delivery.ts does,
// then marks the order completed.
//
// Protected by CRON_SECRET so only Vercel's scheduler (or you,
// manually, with the right header) can trigger it — this must NOT
// be callable by just anyone hitting the URL.

import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

const AUTO_RELEASE_DAYS = 14;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only Vercel Cron (or someone with the secret) can call this
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - AUTO_RELEASE_DAYS);

  const results = { checked: 0, released: 0, skipped: 0, failed: 0 };

  try {
    const snap = await adminDb.collection("orders")
      .where("escrowStatus", "==", "shipped")
      .get();

    results.checked = snap.docs.length;

    for (const docSnap of snap.docs) {
      const order = docSnap.data();
      const shippedAt = order.shippedAt?.toDate?.() || new Date(order.shippedAt);

      // Not old enough yet — leave it alone
      if (!shippedAt || shippedAt > cutoff) {
        results.skipped++;
        continue;
      }

      try {
        // Pay the seller, same as the manual confirm-delivery flow —
        // skip if somehow already paid (shouldn't happen, but safe)
        let transferId: string | null = null;
        if (order.payoutStatus !== "paid") {
          if (!order.sellerStripeAccountId || !order.sellerPayout || order.sellerPayout <= 0) {
            console.error(`Auto-release skipped for order ${docSnap.id}: missing payout account or amount.`);
            results.skipped++;
            continue;
          }

          const transfer = await stripe.transfers.create({
            amount:         Math.round(order.sellerPayout * 100),
            currency:       (order.currency || "CAD").toLowerCase(),
            destination:    order.sellerStripeAccountId,
            transfer_group: docSnap.id,
            metadata:       { orderId: docSnap.id, sellerId: order.sellerId, autoReleased: "true" },
          });
          transferId = transfer.id;
        }

        await docSnap.ref.update({
          escrowStatus:     "completed",
          deliveredAt:      new Date(),
          payoutStatus:     "paid",
          autoReleased:     true,
          ...(transferId ? { stripeTransferId: transferId } : {}),
          updatedAt:        new Date(),
        });

        // Notify seller
        await adminDb.collection("notifications").doc(order.sellerId)
          .collection("items").add({
            userId:    order.sellerId,
            type:      "payment",
            title:     "💰 Payment Auto-Released!",
            body:      `Order #${docSnap.id.slice(-6).toUpperCase()} for ${order.productName} was shipped ${AUTO_RELEASE_DAYS} days ago with no issues reported. CA$${order.sellerPayout} has been sent to your bank account.`,
            link:      `/seller/dashboard`,
            read:      false,
            createdAt: new Date(),
          });

        // Notify buyer, in case they simply forgot
        await adminDb.collection("notifications").doc(order.buyerId)
          .collection("items").add({
            userId:    order.buyerId,
            type:      "system",
            title:     "Order marked as delivered",
            body:      `Your order for ${order.productName} was automatically marked as delivered after ${AUTO_RELEASE_DAYS} days. If you never received it, please contact support right away.`,
            link:      `/orders/${docSnap.id}`,
            read:      false,
            createdAt: new Date(),
          });

        results.released++;
      } catch (err: any) {
        console.error(`Auto-release failed for order ${docSnap.id}:`, err.message);
        results.failed++;
      }
    }

    return res.status(200).json(results);
  } catch (err: any) {
    console.error("Auto-release-delivery cron error:", err);
    return res.status(500).json({ error: err.message });
  }
}
