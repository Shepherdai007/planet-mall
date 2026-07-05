// services/shopService.ts
// ─── SHOP FIRESTORE OPERATIONS ──────────────────────────────────

import {
  doc, collection, addDoc, updateDoc, getDoc,
  query, where, getDocs, serverTimestamp,
} from "firebase/firestore";
import {
  ref, uploadBytesResumable, getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export interface ShopData {
  shopId?:       string;
  ownerId:       string;
  name:          string;
  tagline:       string;
  description:   string;
  category:      string;
  logoURL:       string;
  bannerURL:     string;
  brandColor:    string;
  accentColor:   string;
  mood:          "minimal" | "bold" | "warm" | "luxury";
  city:          string;
  country:       string;
  returnPolicy:  string;
  shippingNote:  string;
  whatsapp:      string;
  instagram:     string;
  website:       string;
  verified:      boolean;
  isLive:        boolean;
  status:        "active" | "paused" | "banned";
  followers:     number;
  totalSales:    number;
  totalOrders:   number;
  rating:        number;
  reviewCount:   number;
  builtByAI:     boolean;
  currency:      "CAD" | "USD" | "EUR" | "GBP";
  // ── Stripe Connect (seller payouts) ──────────────────────────
  stripeAccountId?:  string;   // Stripe Connect Express account ID (acct_...)
  payoutsEnabled?:   boolean;  // true once seller finishes Stripe onboarding
  detailsSubmitted?: boolean;  // true once seller submitted required info to Stripe
}

export async function createShop(data: Omit<ShopData, "shopId">): Promise<string> {
  const docRef = await addDoc(collection(db, "shops"), {
    ...data,
    payoutsEnabled:   false,
    detailsSubmitted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(docRef, { shopId: docRef.id });
  return docRef.id;
}

export async function updateShop(shopId: string, data: Partial<ShopData>): Promise<void> {
  await updateDoc(doc(db, "shops", shopId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getShopByOwner(ownerId: string): Promise<ShopData | null> {
  const q = query(collection(db, "shops"), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { shopId: snap.docs[0].id, ...snap.docs[0].data() } as ShopData;
}

export async function getShopById(shopId: string): Promise<ShopData | null> {
  const snap = await getDoc(doc(db, "shops", shopId));
  if (!snap.exists()) return null;
  return { shopId: snap.id, ...snap.data() } as ShopData;
}

export async function uploadShopImage(
  file: File,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}
