// services/productService.ts
// ─── PRODUCT FIRESTORE OPERATIONS ───────────────────────────────

import {
  doc, collection, addDoc, updateDoc, deleteDoc,
  query, where, getDocs, orderBy, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export interface ProductData {
  productId?:   string;
  shopId:       string;
  ownerId:      string;
  name:         string;
  description:  string;
  price:        number;
  comparePrice: number | null;
  category:     string;
  images:       string[];
  status:       "live" | "draft" | "sold_out";
  stock:        number;
  sku:          string;
  weight:       number;
  shipping:     "standard" | "express" | "pickup" | "digital";
  tags:         string[];
  views:        number;
  orders:       number;
  rating:       number;
  reviewCount:  number;
  aiGenerated:  boolean;
  currency:     "CAD" | "USD" | "EUR" | "GBP";
}

export async function createProduct(data: Omit<ProductData, "productId">): Promise<string> {
  const docRef = await addDoc(collection(db, "products"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(docRef, { productId: docRef.id });
  return docRef.id;
}

export async function updateProduct(productId: string, data: Partial<ProductData>): Promise<void> {
  await updateDoc(doc(db, "products", productId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, "products", productId));
}

// Get all products for a shop — sorted client-side (avoid composite index requirement)
export async function getProductsByShop(shopId: string): Promise<ProductData[]> {
  const q = query(collection(db, "products"), where("shopId", "==", shopId));
  const snap = await getDocs(q);
  const products = snap.docs.map(
    (d) => ({ productId: d.id, ...d.data() } as ProductData)
  );
  // Sort client-side: newest first
  return products.sort((a: any, b: any) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
}

export async function uploadProductImage(
  file: File,
  shopId: string,
  productId: string,
  index: number,
  onProgress?: (pct: number) => void
): Promise<string> {
  const storageRef = ref(storage, `products/${shopId}/${productId}/image-${index}`);
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
