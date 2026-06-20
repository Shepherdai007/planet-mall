// services/classifiedService.ts
// ─── CLASSIFIEDS FIRESTORE OPERATIONS ───────────────────────────
// Classifieds are different from products:
// - No cart/checkout by default
// - Location-based
// - Can be boosted for CA$2.99
// - Direct contact between buyer and seller

import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, limit, serverTimestamp, deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Classified {
  id?:          string;
  sellerId:     string;
  sellerName:   string;
  sellerPhoto:  string;
  title:        string;
  description:  string;
  price:        number;
  currency:     string;   // e.g. "CAD", "USD", "GBP", "JPY", "GHS"
  priceType:    "fixed" | "negotiable" | "free" | "contact";
  category:     string;
  subCategory:  string;
  images:       string[];
  city:         string;
  province:     string;
  country:      string;
  condition:    "new" | "like_new" | "good" | "fair" | "parts_only" | "na";
  status:       "active" | "sold" | "expired" | "pending";
  featured:     boolean;     // paid boost
  featuredUntil: unknown | null;
  verified:     boolean;
  views:        number;
  useEscrow:    boolean;     // seller opted into Planet Mall escrow
  phone?:       string;
  whatsapp?:    string;
  tags:         string[];
  createdAt:    unknown;
  expiresAt:    unknown;     // listings expire after 30 days
}

export const CLASSIFIED_CATEGORIES = {
  "Cars & Vehicles":     ["Cars & Trucks", "Motorcycles", "RVs & Campers", "Boats", "Parts & Accessories", "Other Vehicles"],
  "Real Estate":         ["Houses for Sale", "Condos for Sale", "Long-term Rentals", "Short-term Rentals", "Commercial", "Land"],
  "Jobs":                ["Full-time", "Part-time", "Contract", "Gigs", "Internships"],
  "Services":            ["Home Services", "Cleaning", "Moving", "Tutoring", "Photography", "Tech Support", "Other"],
  "Electronics":         ["Phones", "Computers", "TVs", "Cameras", "Gaming", "Audio", "Other"],
  "Fashion":             ["Men's Clothing", "Women's Clothing", "Kids Clothing", "Shoes", "Bags", "Jewelry"],
  "Home & Garden":       ["Furniture", "Appliances", "Tools", "Garden", "Decor", "Other"],
  "Pets":                ["Dogs", "Cats", "Birds", "Fish", "Small Animals", "Pet Supplies"],
  "Sports & Outdoors":   ["Exercise Equipment", "Bikes", "Winter Sports", "Team Sports", "Camping", "Other"],
  "Collision Repair":    ["Auto Body Repair", "Paint & Refinishing", "Dent Removal", "Windshield Repair", "Frame Straightening", "Other"],
  "Taxi Service":        ["Local Rides", "Airport Transfer", "Long Distance", "Delivery & Courier", "Charter & Group", "Other"],
  "Free Stuff":          ["Free Stuff"],
  "Other":               ["Miscellaneous"],
};

export const PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland", "Nova Scotia", "Ontario", "PEI",
  "Quebec", "Saskatchewan", "Other"
];

// ── Create listing ────────────────────────────────────────────────
export async function createClassified(data: Omit<Classified, "id" | "createdAt" | "expiresAt" | "views" | "featured" | "verified">): Promise<string> {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days

  const ref = await addDoc(collection(db, "classifieds"), {
    ...data,
    views:        0,
    featured:     false,
    featuredUntil: null,
    verified:     false,
    createdAt:    serverTimestamp(),
    expiresAt:    expires,
  });
  await updateDoc(ref, { id: ref.id });
  return ref.id;
}

// ── Get listings with filters ─────────────────────────────────────
export async function getClassifieds(filters: {
  category?: string;
  city?:     string;
  search?:   string;
  maxPrice?: number;
  featured?: boolean;
  limit?:    number;
}): Promise<Classified[]> {
  let q = query(
    collection(db, "classifieds"),
    where("status", "==", "active"),
    limit(filters.limit || 50)
  );

  if (filters.category && filters.category !== "All") {
    q = query(q, where("category", "==", filters.category));
  }

  const snap = await getDocs(q);
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Classified));

  // Client-side filters
  if (filters.search) {
    const s = filters.search.toLowerCase();
    results = results.filter(c =>
      c.title.toLowerCase().includes(s) ||
      c.description.toLowerCase().includes(s) ||
      c.city.toLowerCase().includes(s)
    );
  }
  if (filters.city) {
    results = results.filter(c => c.city.toLowerCase().includes(filters.city!.toLowerCase()));
  }
  if (filters.maxPrice) {
    results = results.filter(c => c.price <= filters.maxPrice!);
  }

  // Featured first, then newest
  return results.sort((a: any, b: any) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
  });
}

// ── Get single listing ────────────────────────────────────────────
export async function getClassified(id: string): Promise<Classified | null> {
  const snap = await getDoc(doc(db, "classifieds", id));
  if (!snap.exists()) return null;
  // Increment views — fire and forget, never block the page on this
  updateDoc(doc(db, "classifieds", id), { views: (snap.data().views || 0) + 1 }).catch(() => {});
  return { id: snap.id, ...snap.data() } as Classified;
}

// ── Get user's listings ───────────────────────────────────────────
export async function getMyClassifieds(sellerId: string): Promise<Classified[]> {
  const q = query(collection(db, "classifieds"), where("sellerId", "==", sellerId));
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Classified));
  return results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

// ── Update listing ────────────────────────────────────────────────
export async function updateClassified(id: string, data: Partial<Classified>): Promise<void> {
  await updateDoc(doc(db, "classifieds", id), { ...data });
}

// ── Delete listing ────────────────────────────────────────────────
export async function deleteClassified(id: string): Promise<void> {
  await deleteDoc(doc(db, "classifieds", id));
}

// ── Mark as sold ──────────────────────────────────────────────────
export async function markAsSold(id: string): Promise<void> {
  await updateDoc(doc(db, "classifieds", id), { status: "sold" });
}
