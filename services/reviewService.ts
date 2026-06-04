// services/reviewService.ts
// ─── REVIEW FIRESTORE OPERATIONS ────────────────────────────────

import {
  collection, addDoc, getDocs, query, where,
  serverTimestamp, updateDoc, doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Review {
  id?:        string;
  productId:  string;
  shopId:     string;
  authorId:   string;
  authorName: string;
  authorPhoto:string;
  rating:     number;   // 1–5
  title:      string;
  body:       string;
  verified:   boolean;  // true if author placed an order for this product
  helpful:    number;
  createdAt:  unknown;
}

export async function createReview(review: Omit<Review, "id" | "createdAt" | "helpful">): Promise<string> {
  const ref = await addDoc(collection(db, "reviews"), {
    ...review,
    helpful:   0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  const q    = query(collection(db, "reviews"), where("productId", "==", productId));
  const snap = await getDocs(q);
  const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
  return reviews.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getShopReviews(shopId: string): Promise<Review[]> {
  const q    = query(collection(db, "reviews"), where("shopId", "==", shopId));
  const snap = await getDocs(q);
  const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
  return reviews.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function markHelpful(reviewId: string, current: number): Promise<void> {
  await updateDoc(doc(db, "reviews", reviewId), { helpful: current + 1 });
}
