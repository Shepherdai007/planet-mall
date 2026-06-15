// services/sellerRatingService.ts
// ─── SELLER RATINGS ───────────────────────────────────────────────
// Stored at /sellerRatings/{sellerId}/reviews/{reviewerId}

import {
  doc, setDoc, getDocs, collection, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SellerReview {
  reviewerId:   string;
  reviewerName: string;
  reviewerPhoto?: string;
  rating:       number;   // 1-5
  comment:      string;
  createdAt:    unknown;
}

export interface SellerRatingSummary {
  average: number;
  count:   number;
}

// ── Submit a rating ───────────────────────────────────────────────
export async function submitSellerRating(
  sellerId: string,
  review: Omit<SellerReview, "createdAt">
): Promise<void> {
  await setDoc(doc(db, "sellerRatings", sellerId, "reviews", review.reviewerId), {
    ...review,
    createdAt: serverTimestamp(),
  });
}

// ── Get all reviews for a seller ──────────────────────────────────
export async function getSellerReviews(sellerId: string): Promise<SellerReview[]> {
  const snap = await getDocs(collection(db, "sellerRatings", sellerId, "reviews"));
  return snap.docs.map(d => d.data() as SellerReview)
    .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// ── Get summary (average + count) ────────────────────────────────
export async function getSellerRatingSummary(sellerId: string): Promise<SellerRatingSummary> {
  const reviews = await getSellerReviews(sellerId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { average: Math.round(avg * 10) / 10, count: reviews.length };
}

// ── Check if user already rated this seller ───────────────────────
export async function hasUserRatedSeller(sellerId: string, userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "sellerRatings", sellerId, "reviews", userId));
  return snap.exists();
}
