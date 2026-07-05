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
      const product  = session.metadata?.product;
      const type     = session.metadata?.type;
      const subId    = session.subscription;

      // ── Marketplace order — activate escrow ──────────────────
      if (type === "marketplace_order") {
        const orderId = session.metadata?.orderId;
        if (orderId) {
          const shipDeadline = new Date();
          shipDeadline.setHours(shipDeadline.getHours() + 48);

          await adminDb.collection("orders").doc(orderId).update({
            escrowStatus:      "paid_held",
            stripePaymentIntent: session.payment_intent || "",
            shipByDeadline:    shipDeadline,
            updatedAt:         new Date(),
          });

          // Notify seller to ship within 48hrs
          const orderSnap = await adminDb.collection("orders").doc(orderId).get();
          const order     = orderSnap.data()!;
          await adminDb.collection("notifications").doc(order.sellerId)
            .collection("items").add({
              userId:    order.sellerId,
              type:      "new_order",
              title:     "🛍️ New Order! Ship within 48 hours",
              body:      `${order.buyerName} ordered ${order.productName} x${order.quantity}. You must ship within 48hrs or the order will be auto-refunded.`,
              link:      `/seller/dashboard`,
              read:      false,
              createdAt: new Date(),
            });

          // Notify buyer
          await adminDb.collection("notifications").doc(order.buyerId)
            .collection("items").add({
              userId:    order.buyerId,
              type:      "payment",
              title:     "✅ Payment Confirmed — Escrow Active",
              body:      `Your payment of CA$${order.totalAmount} for ${order.productName} is held safely. You'll be notified when it ships.`,
              link:      `/orders/${orderId}`,
              read:      false,
              createdAt: new Date(),
            });
        }
        break;
      }

      // ── One-time payments (job posting, resume builder, listing boost) ──
      if (product && userId) {
        const refId = session.metadata?.refId || "";
        await adminDb.collection("paymentReceipts").add({
          userId, product, refId,
          amount:    session.amount_total,
          stripeSessionId: session.id,
          createdAt: new Date(),
        });
        // Mark the pending job/resume as paid — actual record creation
        // happens client-side on the success page using the session_id
        // as proof of payment, then this receipt is the audit trail.
        break;
      }

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

      // Insurance broker Pro plan — unlock full lead contact info
      if (plan === "broker") {
        const brokerSnap = await adminDb.collection("insuranceBrokers")
          .where("userId", "==", userId).limit(1).get();
        if (!brokerSnap.empty) {
          await brokerSnap.docs[0].ref.update({ isPro: true, updatedAt: new Date() });
        }
      }
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

      // Downgrade broker — revert to limited free tier
      const brokerSnap = await adminDb.collection("insuranceBrokers")
        .where("userId", "==", userId).limit(1).get();
      if (!brokerSnap.empty) {
        await brokerSnap.docs[0].ref.update({ isPro: false, updatedAt: new Date() });
      }
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

// ── Auto-refund overdue orders (call this from a cron job or webhook) ──
// Orders where seller didn't ship within 48hrs get auto-refunded
export async function checkAndRefundOverdueOrders(): Promise<void> {
  const now  = new Date();
  const snap = await adminDb.collection("orders")
    .where("escrowStatus", "==", "paid_held")
    .get();

  for (const docSnap of snap.docs) {
    const order    = docSnap.data();
    const deadline = order.shipByDeadline?.toDate?.() || new Date(order.shipByDeadline);
    if (now > deadline) {
      // Actually refund the buyer's card via Stripe — this was missing
      // before, meaning orders were marked "refunded" in Firestore
      // without the buyer ever getting their money back.
      try {
        if (order.stripePaymentIntent) {
          await stripe.refunds.create({
            payment_intent: order.stripePaymentIntent,
            reason: "requested_by_customer",
          });
        } else {
          console.error(`No stripePaymentIntent on order ${docSnap.id} — cannot auto-refund via Stripe.`);
          continue; // skip marking as refunded if we can't actually refund
        }
      } catch (err: any) {
        console.error(`Stripe refund failed for order ${docSnap.id}:`, err.message);
        continue; // don't mark as refunded if the Stripe call failed
      }

      await docSnap.ref.update({
        escrowStatus: "refunded",
        adminNote:    "Auto-refunded: seller did not ship within 48 hours",
        updatedAt:    new Date(),
      });

      // Notify buyer of refund
      await adminDb.collection("notifications").doc(order.buyerId)
        .collection("items").add({
          userId:    order.buyerId,
          type:      "payment",
          title:     "↩️ Order Refunded",
          body:      `Your order for ${order.productName} was automatically refunded because the seller did not ship within 48 hours.`,
          link:      `/orders/${docSnap.id}`,
          read:      false,
          createdAt: new Date(),
        });

      // Notify seller
      await adminDb.collection("notifications").doc(order.sellerId)
        .collection("items").add({
          userId:    order.sellerId,
          type:      "system",
          title:     "⚠️ Order Auto-Refunded",
          body:      `Order for ${order.productName} was refunded to the buyer because you did not ship within 48 hours.`,
          link:      `/seller/dashboard`,
          read:      false,
          createdAt: new Date(),
        });
    }
  }
}
