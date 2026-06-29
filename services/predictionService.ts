// services/predictionService.ts
// ─── SPORTS PREDICTIONS & TIPSTER PLATFORM ───────────────────────
// Free predictions anyone can post.
// VIP picks are paid — escrow holds until buyer confirms receipt.
// Planet Mall takes 5% commission on paid picks.

import {
  doc, collection, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, limit as fbLimit, serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/services/notificationService";
import { sendPush } from "@/lib/sendPush";

export const SPORTS = [
  "Football", "Basketball", "Tennis", "Cricket",
  "Rugby", "Baseball", "Hockey", "Boxing", "MMA", "Other",
];

export const TIP_CATEGORIES = [
  "Safe Tips", "Daily 5+ Odds", "Daily 10+ Odds",
  "Over/Under Tips", "Double Tips", "Single Game",
  "Both Teams to Score", "Correct Score", "VIP Fixed Game", "Other",
];

// ── Tipster profile ───────────────────────────────────────────────
export interface Tipster {
  id?:          string;   // = userId
  userId:       string;
  name:         string;
  photo:        string;
  bio:          string;
  verified:     boolean;
  winCount:     number;
  lossCount:    number;
  totalPicks:   number;
  followers:    number;
  // Social links
  telegram:     string;
  whatsapp:     string;
  twitter:      string;
  instagram:    string;
  youtube:      string;
  facebook:     string;
  threads:      string;
  createdAt:    unknown;
}

// ── Free prediction ───────────────────────────────────────────────
export interface Prediction {
  id?:          string;
  tipsterId:    string;
  tipsterName:  string;
  tipsterPhoto: string;
  verified:     boolean;
  sport:        string;
  category:     string;
  matchDate:    string;     // ISO date string
  matchTime:    string;     // e.g. "20:00"
  league:       string;     // e.g. "FIFA: World Cup"
  homeTeam:     string;
  awayTeam:     string;
  tip:          string;     // e.g. "Argentina Over 1.5 Goals"
  odds:         number;     // e.g. 1.30
  analysis:     string;     // tipster's reasoning
  result:       "pending" | "won" | "lost" | "void";
  likes:        number;
  views:        number;
  createdAt:    unknown;
}

// ── VIP / paid pick ───────────────────────────────────────────────
export interface VIPPick {
  id?:          string;
  tipsterId:    string;
  tipsterName:  string;
  tipsterPhoto: string;
  verified:     boolean;
  title:        string;     // e.g. "Weekend Fixed Games — 3 Matches"
  description:  string;     // teaser, not the actual picks
  sport:        string;
  matchDate:    string;
  price:        number;     // what buyer pays
  currency:     string;
  commission:   number;     // 5% of price
  tipsterPayout: number;    // price - commission
  picksContent: string;     // HIDDEN until paid — the actual games
  buyerCount:   number;
  status:       "active" | "expired" | "sold_out";
  result:       "pending" | "won" | "lost" | "void";
  createdAt:    unknown;
  expiresAt:    unknown;
}

// ── Pick purchase (escrow) ────────────────────────────────────────
export interface PickPurchase {
  id?:            string;
  pickId:         string;
  pickTitle:      string;
  tipsterId:      string;
  buyerId:        string;
  buyerEmail:     string;
  amount:         number;
  currency:       string;
  commission:     number;
  tipsterPayout:  number;
  escrowStatus:   "held" | "released" | "disputed";
  deliveryConfirmedAt?: unknown;
  createdAt:      unknown;
}

export const COMMISSION_RATE = 0.05; // 5%

// ── Follow / unfollow a tipster ───────────────────────────────────
export async function followTipster(tipsterId: string, userId: string): Promise<void> {
  await addDoc(collection(db, "tipsterFollows"), {
    tipsterId, userId, createdAt: serverTimestamp(),
  });
  const snap = await getDocs(query(collection(db, "tipsters"), where("userId", "==", tipsterId)));
  if (!snap.empty) await updateDoc(snap.docs[0].ref, { followers: increment(1) });
}

export async function unfollowTipster(tipsterId: string, userId: string): Promise<void> {
  const snap = await getDocs(query(
    collection(db, "tipsterFollows"),
    where("tipsterId", "==", tipsterId),
    where("userId", "==", userId)
  ));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  const tipSnap = await getDocs(query(collection(db, "tipsters"), where("userId", "==", tipsterId)));
  if (!tipSnap.empty) await updateDoc(tipSnap.docs[0].ref, { followers: increment(-1) });
}

export async function isFollowingTipster(tipsterId: string, userId: string): Promise<boolean> {
  const snap = await getDocs(query(
    collection(db, "tipsterFollows"),
    where("tipsterId", "==", tipsterId),
    where("userId", "==", userId)
  ));
  return !snap.empty;
}

// ── Tipster CRUD ──────────────────────────────────────────────────
export async function createTipsterProfile(data: Omit<Tipster, "id" | "createdAt" | "winCount" | "lossCount" | "totalPicks" | "followers" | "verified">): Promise<void> {
  await addDoc(collection(db, "tipsters"), {
    ...data,
    verified:   false,
    winCount:   0,
    lossCount:  0,
    totalPicks: 0,
    followers:  0,
    createdAt:  serverTimestamp(),
  });
}

export async function getTipsterProfile(userId: string): Promise<Tipster | null> {
  const snap = await getDocs(query(collection(db, "tipsters"), where("userId", "==", userId)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Tipster;
}

export async function updateTipsterProfile(id: string, data: Partial<Tipster>): Promise<void> {
  await updateDoc(doc(db, "tipsters", id), data as any);
}

export async function getAllTipsters(): Promise<Tipster[]> {
  const snap = await getDocs(collection(db, "tipsters"));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tipster));
  results.sort((a, b) => (b.followers || 0) - (a.followers || 0));
  return results;
}

// ── Free predictions ──────────────────────────────────────────────
export async function createPrediction(data: Omit<Prediction, "id" | "createdAt" | "result" | "likes" | "views">): Promise<string> {
  const ref = await addDoc(collection(db, "predictions"), {
    ...data,
    result:    "pending",
    likes:     0,
    views:     0,
    createdAt: serverTimestamp(),
  });

  // Increment tipster total picks
  const tipsterSnap = await getDocs(query(collection(db, "tipsters"), where("userId", "==", data.tipsterId)));
  if (!tipsterSnap.empty) {
    await updateDoc(tipsterSnap.docs[0].ref, { totalPicks: increment(1) });
  }

  // Notify all followers
  try {
    const followsSnap = await getDocs(query(
      collection(db, "tipsterFollows"),
      where("tipsterId", "==", data.tipsterId)
    ));

    const notifPromises = followsSnap.docs.map(async d => {
      const followerId = d.data().userId;
      const notifLink  = `/predictions/tipster/${data.tipsterId}`;
      const title      = `🏆 ${data.tipsterName} posted a new tip!`;
      const body       = `${data.homeTeam} vs ${data.awayTeam} — ${data.tip} @ ${data.odds}`;

      // In-app notification
      await createNotification({
        userId: followerId,
        type:   "system",
        title,
        body,
        link:   notifLink,
      });

      // Push notification
      sendPush({ userId: followerId, title, body, url: `https://planetmallshop.com${notifLink}` }).catch(() => {});
    });

    await Promise.all(notifPromises);
  } catch (e) {
    // Never block prediction creation if notifications fail
    console.error("Failed to notify followers:", e);
  }

  return ref.id;
}

export async function getPredictions(filters: {
  sport?:     string;
  tipsterId?: string;
  date?:      string;
  limit?:     number;
} = {}): Promise<Prediction[]> {
  const snap = await getDocs(collection(db, "predictions"));
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Prediction));

  if (filters.sport && filters.sport !== "All") {
    results = results.filter(p => p.sport === filters.sport);
  }
  if (filters.tipsterId) {
    results = results.filter(p => p.tipsterId === filters.tipsterId);
  }
  if (filters.date) {
    results = results.filter(p => p.matchDate === filters.date);
  }

  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  if (filters.limit) results = results.slice(0, filters.limit);
  return results;
}

export async function updatePredictionResult(id: string, result: Prediction["result"]): Promise<void> {
  await updateDoc(doc(db, "predictions", id), { result });
  // Update tipster win/loss count
  const snap = await getDoc(doc(db, "predictions", id));
  if (!snap.exists()) return;
  const pred = snap.data() as Prediction;
  const tipsterSnap = await getDocs(query(collection(db, "tipsters"), where("userId", "==", pred.tipsterId)));
  if (!tipsterSnap.empty) {
    if (result === "won") await updateDoc(tipsterSnap.docs[0].ref, { winCount: increment(1) });
    if (result === "lost") await updateDoc(tipsterSnap.docs[0].ref, { lossCount: increment(1) });
  }
}

export async function likePrediction(id: string): Promise<void> {
  await updateDoc(doc(db, "predictions", id), { likes: increment(1) });
}

// ── VIP picks ─────────────────────────────────────────────────────
export async function createVIPPick(data: Omit<VIPPick, "id" | "createdAt" | "expiresAt" | "buyerCount" | "status" | "result" | "commission" | "tipsterPayout">): Promise<string> {
  const commission   = Math.round(data.price * COMMISSION_RATE * 100) / 100;
  const tipsterPayout = data.price - commission;
  const expires = new Date();
  expires.setDate(expires.getDate() + 1); // VIP picks expire in 24hrs

  const ref = await addDoc(collection(db, "vipPicks"), {
    ...data,
    commission,
    tipsterPayout,
    buyerCount: 0,
    status:     "active",
    result:     "pending",
    createdAt:  serverTimestamp(),
    expiresAt:  expires,
  });
  return ref.id;
}

export async function getVIPPicks(filters: { tipsterId?: string; sport?: string } = {}): Promise<VIPPick[]> {
  const snap = await getDocs(query(collection(db, "vipPicks"), where("status", "==", "active")));
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as VIPPick));
  if (filters.tipsterId) results = results.filter(p => p.tipsterId === filters.tipsterId);
  if (filters.sport && filters.sport !== "All") results = results.filter(p => p.sport === filters.sport);
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

export async function getVIPPick(id: string): Promise<VIPPick | null> {
  const snap = await getDoc(doc(db, "vipPicks", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as VIPPick;
}

// ── Check if buyer already purchased a pick ───────────────────────
export async function hasPurchasedPick(pickId: string, buyerId: string): Promise<boolean> {
  const snap = await getDocs(query(
    collection(db, "pickPurchases"),
    where("pickId", "==", pickId),
    where("buyerId", "==", buyerId)
  ));
  return !snap.empty;
}

// ── Get buyer's purchases ─────────────────────────────────────────
export async function getMyPurchases(buyerId: string): Promise<PickPurchase[]> {
  const snap = await getDocs(query(collection(db, "pickPurchases"), where("buyerId", "==", buyerId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as PickPurchase));
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

// ── Confirm delivery → release escrow ────────────────────────────
export async function confirmPickDelivery(purchaseId: string): Promise<void> {
  await updateDoc(doc(db, "pickPurchases", purchaseId), {
    escrowStatus:        "released",
    deliveryConfirmedAt: serverTimestamp(),
  });
}
