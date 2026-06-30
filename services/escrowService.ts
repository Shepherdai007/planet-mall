// services/escrowService.ts
// ─── PLANET MALL ESCROW SYSTEM ────────────────────────────────────
// ALL marketplace orders go through escrow.
// Money held by Stripe until buyer confirms delivery.
// If seller doesn't ship in 48hrs → auto refund.
// If buyer disputes → Planet Mall admin decides.

import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, serverTimestamp, onSnapshot, type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type EscrowStatus =
  | "pending_payment"   // waiting for Stripe payment
  | "paid_held"         // paid, money held, waiting for seller to ship
  | "shipped"           // seller marked as shipped
  | "delivered"         // buyer confirmed delivery → release funds
  | "disputed"          // buyer opened dispute
  | "refunded"          // buyer refunded (auto or manual)
  | "completed";        // funds released to seller

export interface Order {
  id?:               string;
  // Parties
  buyerId:           string;
  buyerName:         string;
  buyerEmail:        string;
  sellerId:          string;
  sellerName:        string;
  // Product
  productId:         string;
  productName:       string;
  productImage:      string;
  quantity:          number;
  unitPrice:         number;
  totalAmount:       number;
  currency:          string;
  // Commission
  platformFee:       number;   // 10% of totalAmount
  sellerPayout:      number;   // totalAmount - platformFee
  // Escrow
  escrowStatus:      EscrowStatus;
  stripeSessionId:   string;
  stripePaymentIntent?: string;
  // Shipping
  shippingAddress:   string;
  trackingNumber?:   string;
  shippedAt?:        unknown;
  deliveredAt?:      unknown;
  // Dispute
  disputeReason?:    string;
  disputeOpenedAt?:  unknown;
  disputeResolvedAt?: unknown;
  adminNote?:        string;
  // Timestamps
  createdAt:         unknown;
  updatedAt:         unknown;
  // Auto-refund deadline (48hrs from paid_held)
  shipByDeadline?:   unknown;
}

export const PLATFORM_FEE_RATE = 0.10; // 10%

// ── Create pending order ──────────────────────────────────────────
export async function createOrder(data: Omit<Order,
  "id" | "createdAt" | "updatedAt" | "escrowStatus" |
  "platformFee" | "sellerPayout" | "shipByDeadline"
>): Promise<string> {
  const platformFee  = Math.round(data.totalAmount * PLATFORM_FEE_RATE * 100) / 100;
  const sellerPayout = Math.round((data.totalAmount - platformFee) * 100) / 100;

  const ref = await addDoc(collection(db, "orders"), {
    ...data,
    platformFee,
    sellerPayout,
    escrowStatus: "pending_payment",
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  });
  return ref.id;
}

// ── Get order ─────────────────────────────────────────────────────
export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

// ── Get buyer orders ──────────────────────────────────────────────
export async function getBuyerOrders(buyerId: string): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, "orders"), where("buyerId", "==", buyerId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

// ── Get seller orders ─────────────────────────────────────────────
export async function getSellerOrders(sellerId: string): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, "orders"), where("sellerId", "==", sellerId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

// ── Listen to buyer orders ────────────────────────────────────────
export function listenBuyerOrders(buyerId: string, callback: (orders: Order[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "orders"), where("buyerId", "==", buyerId)),
    snap => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      orders.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(orders);
    }
  );
}

// ── Listen to seller orders ───────────────────────────────────────
export function listenSellerOrders(sellerId: string, callback: (orders: Order[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "orders"), where("sellerId", "==", sellerId)),
    snap => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      orders.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(orders);
    }
  );
}

// ── Escrow status label & color ───────────────────────────────────
export function getStatusLabel(status: EscrowStatus): string {
  const labels: Record<EscrowStatus, string> = {
    pending_payment: "⏳ Awaiting Payment",
    paid_held:       "💰 Paid — Awaiting Shipment",
    shipped:         "🚚 Shipped",
    delivered:       "✅ Delivered",
    disputed:        "⚠️ Disputed",
    refunded:        "↩️ Refunded",
    completed:       "✅ Completed",
  };
  return labels[status] || status;
}

export function getStatusColor(status: EscrowStatus): string {
  const colors: Record<EscrowStatus, string> = {
    pending_payment: "#8A8480",
    paid_held:       "#D4A84B",
    shipped:         "#0088cc",
    delivered:       "#2A6B45",
    disputed:        "#C4531A",
    refunded:        "#8A8480",
    completed:       "#2A6B45",
  };
  return colors[status] || "#8A8480";
}
