// services/trustService.ts
// ─── PLANET MALL TRUST SCORE & SELLER LIMITS ─────────────────────
// New sellers start at Level 1 — low limits, long escrow hold.
// Trust builds with successful orders and no disputes.
// Protects buyers from scammers while letting good sellers grow.

import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Trust levels ──────────────────────────────────────────────────
export interface TrustProfile {
  userId:              string;
  level:               1 | 2 | 3 | 4;
  score:               number;        // 0-100
  totalOrders:         number;        // completed orders
  disputesAgainst:     number;        // disputes ruled against seller
  disputesWon:         number;        // disputes ruled in seller's favour
  averageRating:       number;        // 1-5 from buyers
  isIdVerified:        boolean;       // government ID uploaded
  isPhoneVerified:     boolean;       // SMS OTP verified
  stripeConnected:     boolean;       // Stripe Connect onboarded
  maxOrderAmount:      number;        // max single order value (CAD)
  escrowHoldDays:      number;        // days money held before release
  createdAt:           unknown;
  updatedAt:           unknown;
}

// ── Level definitions ─────────────────────────────────────────────
export const TRUST_LEVELS = {
  1: {
    label:          "New Seller",
    color:          "#8A8480",
    badge:          "🆕",
    maxOrderAmount: 50,
    escrowHoldDays: 5,
    description:    "Complete 5 orders to reach Level 2",
    requirements:   "0 completed orders",
  },
  2: {
    label:          "Trusted Seller",
    color:          "#D4A84B",
    badge:          "⭐",
    maxOrderAmount: 200,
    escrowHoldDays: 3,
    description:    "Complete 20 orders to reach Level 3",
    requirements:   "5+ completed orders, no disputes",
  },
  3: {
    label:          "Verified Seller",
    color:          "#C4531A",
    badge:          "✅",
    maxOrderAmount: 1000,
    escrowHoldDays: 2,
    description:    "Complete 50 orders to reach Level 4",
    requirements:   "20+ orders, ID verified",
  },
  4: {
    label:          "Elite Seller",
    color:          "#2A6B45",
    badge:          "🏆",
    maxOrderAmount: 999999,
    escrowHoldDays: 1,
    description:    "Top tier — no limits",
    requirements:   "50+ orders, Stripe connected, ID verified",
  },
};

// ── Get or create trust profile ───────────────────────────────────
export async function getTrustProfile(userId: string): Promise<TrustProfile> {
  const snap = await getDoc(doc(db, "trustProfiles", userId));
  if (snap.exists()) return snap.data() as TrustProfile;

  // Create default Level 1 profile for new sellers
  const defaultProfile: TrustProfile = {
    userId,
    level:           1,
    score:           0,
    totalOrders:     0,
    disputesAgainst: 0,
    disputesWon:     0,
    averageRating:   0,
    isIdVerified:    false,
    isPhoneVerified: false,
    stripeConnected: false,
    maxOrderAmount:  TRUST_LEVELS[1].maxOrderAmount,
    escrowHoldDays:  TRUST_LEVELS[1].escrowHoldDays,
    createdAt:       serverTimestamp(),
    updatedAt:       serverTimestamp(),
  };
  await setDoc(doc(db, "trustProfiles", userId), defaultProfile);
  return defaultProfile;
}

// ── Recalculate trust level after an order completes ─────────────
export async function recalculateTrust(userId: string): Promise<void> {
  const profile = await getTrustProfile(userId);

  let newLevel: 1 | 2 | 3 | 4 = 1;
  let newScore = 0;

  // Score calculation
  newScore += Math.min(profile.totalOrders * 2, 40);        // max 40pts from orders
  newScore += profile.isIdVerified    ? 20 : 0;             // 20pts for ID
  newScore += profile.isPhoneVerified ? 10 : 0;             // 10pts for phone
  newScore += profile.stripeConnected ? 15 : 0;             // 15pts for Stripe
  newScore += Math.min(profile.averageRating * 3, 15);      // max 15pts from rating
  newScore -= profile.disputesAgainst * 10;                 // -10pts per dispute against
  newScore  = Math.max(0, Math.min(100, newScore));

  // Level gates
  if (
    profile.totalOrders >= 50 &&
    profile.isIdVerified &&
    profile.stripeConnected &&
    profile.disputesAgainst === 0
  ) {
    newLevel = 4;
  } else if (
    profile.totalOrders >= 20 &&
    profile.isIdVerified &&
    profile.disputesAgainst <= 1
  ) {
    newLevel = 3;
  } else if (
    profile.totalOrders >= 5 &&
    profile.disputesAgainst === 0
  ) {
    newLevel = 2;
  }

  await updateDoc(doc(db, "trustProfiles", userId), {
    level:          newLevel,
    score:          newScore,
    maxOrderAmount: TRUST_LEVELS[newLevel].maxOrderAmount,
    escrowHoldDays: TRUST_LEVELS[newLevel].escrowHoldDays,
    updatedAt:      serverTimestamp(),
  });
}

// ── Increment completed orders ────────────────────────────────────
export async function incrementCompletedOrders(userId: string): Promise<void> {
  const profile = await getTrustProfile(userId);
  await updateDoc(doc(db, "trustProfiles", userId), {
    totalOrders: profile.totalOrders + 1,
    updatedAt:   serverTimestamp(),
  });
  await recalculateTrust(userId);
}

// ── Record dispute against seller ─────────────────────────────────
export async function recordDisputeAgainst(userId: string): Promise<void> {
  const profile = await getTrustProfile(userId);
  await updateDoc(doc(db, "trustProfiles", userId), {
    disputesAgainst: profile.disputesAgainst + 1,
    updatedAt:       serverTimestamp(),
  });
  await recalculateTrust(userId);
}

// ── Check if seller can accept this order amount ──────────────────
export async function canAcceptOrder(sellerId: string, amount: number): Promise<{
  allowed: boolean;
  reason?: string;
  limit:   number;
  level:   number;
}> {
  const profile = await getTrustProfile(sellerId);
  if (amount > profile.maxOrderAmount) {
    return {
      allowed: false,
      reason:  `This seller's current limit is CA$${profile.maxOrderAmount} per order. They need to complete more orders to increase their limit.`,
      limit:   profile.maxOrderAmount,
      level:   profile.level,
    };
  }
  return { allowed: true, limit: profile.maxOrderAmount, level: profile.level };
}
