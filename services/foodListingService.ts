// services/foodListingService.ts
// ─── STANDALONE FOOD LISTINGS ────────────────────────────────────
// Works like classifieds — anyone can post a food item without
// needing a full shop. Buyers order through the existing cart +
// checkout + escrow flow (2hr instant-release rule applies).

import {
  doc, collection, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, limit as fbLimit, serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface FoodListing {
  id?:           string;
  sellerId:      string;
  sellerName:    string;
  sellerPhoto:   string;
  name:          string;
  description:   string;
  price:         number;
  currency:      string;
  priceType:     "fixed" | "negotiable" | "contact";
  category:      string;        // one of FOOD_CATEGORIES
  images:        string[];
  city:          string;
  province:      string;
  country:       string;
  prepTime:      string;        // e.g. "30 mins", "Ready now"
  phone:         string;
  whatsapp:      string;
  status:        "active" | "paused" | "sold_out";
  views:         number;
  createdAt:     unknown;
}

export const FOOD_CATEGORIES = [
  "Food & Beverages",
  "Restaurant & Takeout",
  "Ready-Made Meals",
  "Catering",
  "Bakery & Pastry",
  "Groceries",
];

// ── Create a food listing ─────────────────────────────────────────
export async function createFoodListing(data: Omit<FoodListing, "id" | "createdAt" | "views">): Promise<string> {
  const ref = await addDoc(collection(db, "foodListings"), {
    ...data,
    views:     0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Update a food listing ─────────────────────────────────────────
export async function updateFoodListing(id: string, data: Partial<FoodListing>): Promise<void> {
  await updateDoc(doc(db, "foodListings", id), data as any);
}

// ── Delete a food listing ─────────────────────────────────────────
export async function deleteFoodListing(id: string): Promise<void> {
  await deleteDoc(doc(db, "foodListings", id));
}

// ── Get a single food listing + increment view ────────────────────
export async function getFoodListing(id: string): Promise<FoodListing | null> {
  const snap = await getDoc(doc(db, "foodListings", id));
  if (!snap.exists()) return null;
  updateDoc(doc(db, "foodListings", id), { views: increment(1) }).catch(() => {});
  return { id: snap.id, ...snap.data() } as FoodListing;
}

// ── Browse food listings ──────────────────────────────────────────
export async function getFoodListings(filters: {
  category?: string;
  city?:     string;
  limit?:    number;
} = {}): Promise<FoodListing[]> {
  let q = query(
    collection(db, "foodListings"),
    where("status", "==", "active"),
  );

  const snap = await getDocs(q);
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodListing));

  if (filters.category && filters.category !== "All") {
    results = results.filter(l => l.category === filters.category);
  }
  if (filters.city) {
    results = results.filter(l => l.city.toLowerCase().includes(filters.city!.toLowerCase()));
  }

  // Sort newest first — client side to avoid composite index
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (filters.limit) results = results.slice(0, filters.limit);
  return results;
}

// ── Get listings by a specific seller ─────────────────────────────
export async function getFoodListingsBySeller(sellerId: string): Promise<FoodListing[]> {
  const snap = await getDocs(query(collection(db, "foodListings"), where("sellerId", "==", sellerId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodListing));
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}
