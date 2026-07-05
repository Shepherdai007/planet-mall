// pages/api/stripe/create-order-checkout.ts
// ─── STRIPE CHECKOUT FOR MARKETPLACE ORDERS ──────────────────────
// Creates escrow order in Firestore then redirects to Stripe.
// Money held until buyer confirms delivery, then seller is paid out
// automatically via Stripe Connect transfer (see release-payout.ts).

import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export const PLATFORM_FEE_RATE = 0.10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const {
    buyerId, buyerName, buyerEmail,
    sellerId, sellerName,
    productId, productName, productImage,
    quantity, unitPrice, currency,
    shippingAddress,
  } = req.body;

  if (!buyerId || !sellerId || !productId || !unitPrice) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // ── Safety check: seller must have finished Stripe Connect ──────
  // Explore already hides unconnected shops, but a buyer could still
  // hit this endpoint directly via an old link — block it here too.
  const shopSnap = await adminDb.collection("shops")
    .where("ownerId", "==", sellerId).limit(1).get();
  if (shopSnap.empty) {
    return res.status(404).json({ error: "Seller shop not found" });
  }
  const shop = shopSnap.docs[0].data();
  if (!shop.payoutsEnabled || !shop.stripeAccountId) {
    return res.status(403).json({ error: "This seller hasn't finished setting up payouts yet. Please check back soon." });
  }
  const sellerStripeAccountId = shop.stripeAccountId as string;

  const totalAmount  = Math.round(unitPrice * quantity * 100) / 100;
  const platformFee  = Math.round(totalAmount * PLATFORM_FEE_RATE * 100) / 100;
  const sellerPayout = Math.round((totalAmount - platformFee) * 100) / 100;
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    // Create order in Firestore first
    const shipDeadline = new Date();
    shipDeadline.setHours(shipDeadline.getHours() + 48);

    const orderRef = await adminDb.collection("orders").add({
      buyerId, buyerName, buyerEmail,
      sellerId, sellerName,
      productId, productName, productImage,
      quantity, unitPrice, totalAmount,
      currency: currency || "CAD",
      platformFee, sellerPayout,
      sellerStripeAccountId,     // needed later to send the seller their cut
      payoutStatus:    "pending", // becomes "paid" once transfer completes
      escrowStatus:    "pending_payment",
      stripeSessionId: "",
      shippingAddress: shippingAddress || "",
      shipByDeadline:  shipDeadline,
      createdAt:       new Date(),
      updatedAt:       new Date(),
    });

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      customer_email:       buyerEmail,
      line_items: [{
        price_data: {
          currency:     (currency || "CAD").toLowerCase(),
          product_data: {
            name:   productName,
            images: productImage ? [productImage] : [],
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity,
      }],
      metadata: {
        orderId:   orderRef.id,
        buyerId,
        sellerId,
        productId,
        type:      "marketplace_order",
      },
      success_url: `${appUrl}/orders/${orderRef.id}?success=1`,
      cancel_url:  `${appUrl}/product/${productId}`,
    });

    // Save session ID to order
    await orderRef.update({ stripeSessionId: session.id });

    return res.status(200).json({ url: session.url, orderId: orderRef.id });
  } catch (err: any) {
    console.error("Order checkout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
