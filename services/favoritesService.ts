// services/favoritesService.ts
// ─── SAVED / FAVOURITE LISTINGS ──────────────────────────────────
// Stored at /favorites/{uid}/items/{listingId}

import {
  doc, setDoc, deleteDoc, onSnapshot, collection,
  getDocs, serverTimestamp, type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface FavoriteItem {
  id:        string;   // listingId
  title:     string;
  image:     string;
  price:     number;
  priceType: string;
  currency:  string;
  city:      string;
  category:  string;
  savedAt:   unknown;
}

// ── Save a listing ────────────────────────────────────────────────
export async function saveListing(userId: string, item: Omit<FavoriteItem, "savedAt">): Promise<void> {
  await setDoc(doc(db, "favorites", userId, "items", item.id), {
    ...item,
    savedAt: serverTimestamp(),
  });
}

// ── Unsave a listing ──────────────────────────────────────────────
export async function unsaveListing(userId: string, listingId: string): Promise<void> {
  await deleteDoc(doc(db, "favorites", userId, "items", listingId));
}

// ── Get all saved listings once ───────────────────────────────────
export async function getSavedListings(userId: string): Promise<FavoriteItem[]> {
  const snap = await getDocs(collection(db, "favorites", userId, "items"));
  return snap.docs.map(d => d.data() as FavoriteItem)
    .sort((a: any, b: any) => (b.savedAt?.seconds || 0) - (a.savedAt?.seconds || 0));
}

// ── Listen to saved listing IDs in real time ──────────────────────
export function listenSavedIds(
  userId: string,
  callback: (ids: Set<string>) => void
): Unsubscribe {
  return onSnapshot(collection(db, "favorites", userId, "items"), snap => {
    callback(new Set(snap.docs.map(d => d.id)));
  });
}
