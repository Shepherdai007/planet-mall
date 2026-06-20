// services/insuranceService.ts
// ─── INSURANCE BROKER LEAD SYSTEM ────────────────────────────────
// Buyers submit a quote request. Verified brokers see matching
// requests in their dashboard and respond directly or via message.

import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/services/notificationService";

// ── Insurance request (buyer-submitted lead) ──────────────────────
export interface InsuranceRequest {
  id?:            string;
  buyerId:        string;
  buyerName:      string;
  buyerPhoto:     string;
  insuranceType:  "Auto" | "Home" | "Life" | "Business" | "Travel" | "Health" | "Other";
  fullName:       string;
  phone:          string;
  email:          string;
  city:           string;
  province:       string;
  details:        string;       // free text — vehicle/home/business info etc
  status:         "open" | "contacted" | "closed";
  respondedBy:    string[];     // brokerIds who have responded
  createdAt:      unknown;
}

// ── Broker profile ─────────────────────────────────────────────────
export interface InsuranceBroker {
  id?:            string;       // = userId
  userId:         string;
  brokerName:     string;
  companyName:    string;
  photo:          string;
  licenseNumber:  string;
  specialties:    string[];     // matches InsuranceRequest.insuranceType values
  city:           string;
  province:       string;
  phone:          string;
  bio:            string;
  verified:       boolean;      // admin-approved
  createdAt:      unknown;
}

export const INSURANCE_TYPES = ["Auto", "Home", "Life", "Business", "Travel", "Health", "Other"];

// ── Submit a quote request ─────────────────────────────────────────
export async function submitInsuranceRequest(
  data: Omit<InsuranceRequest, "id" | "createdAt" | "status" | "respondedBy">
): Promise<string> {
  const ref = await addDoc(collection(db, "insuranceRequests"), {
    ...data,
    status:      "open",
    respondedBy: [],
    createdAt:   serverTimestamp(),
  });

  // Notify all verified brokers matching this insurance type
  const brokerSnap = await getDocs(query(
    collection(db, "insuranceBrokers"),
    where("verified", "==", true),
    where("specialties", "array-contains", data.insuranceType)
  ));

  await Promise.all(brokerSnap.docs.map(b =>
    createNotification({
      userId: b.data().userId,
      type:   "system",
      title:  `New ${data.insuranceType} insurance request 📋`,
      body:   `${data.fullName} in ${data.city} is requesting a quote.`,
      link:   `/insurance/broker-dashboard`,
    })
  ));

  return ref.id;
}

// ── Get all requests (for broker dashboard) ────────────────────────
export async function getInsuranceRequests(filters: {
  insuranceType?: string;
  status?:        string;
} = {}): Promise<InsuranceRequest[]> {
  const snap = await getDocs(collection(db, "insuranceRequests"));
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as InsuranceRequest));

  if (filters.insuranceType && filters.insuranceType !== "All") {
    results = results.filter(r => r.insuranceType === filters.insuranceType);
  }
  if (filters.status) {
    results = results.filter(r => r.status === filters.status);
  }

  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

// ── Get a buyer's own requests ──────────────────────────────────────
export async function getMyInsuranceRequests(buyerId: string): Promise<InsuranceRequest[]> {
  const snap = await getDocs(query(collection(db, "insuranceRequests"), where("buyerId", "==", buyerId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as InsuranceRequest));
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

// ── Broker marks a request as contacted ─────────────────────────────
export async function markRequestContacted(requestId: string, brokerId: string): Promise<void> {
  const ref  = doc(db, "insuranceRequests", requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const existing = (snap.data().respondedBy || []) as string[];
  if (!existing.includes(brokerId)) {
    await updateDoc(ref, {
      status:      "contacted",
      respondedBy: [...existing, brokerId],
    });
  }
}

// ── Register as a broker (pending verification) ─────────────────────
export async function registerBroker(data: Omit<InsuranceBroker, "id" | "createdAt" | "verified">): Promise<void> {
  await addDoc(collection(db, "insuranceBrokers"), {
    ...data,
    verified:  false,   // admin must verify before they appear/get leads
    createdAt: serverTimestamp(),
  });
}

// ── Check if current user is a registered broker ────────────────────
export async function getBrokerProfile(userId: string): Promise<InsuranceBroker | null> {
  const snap = await getDocs(query(collection(db, "insuranceBrokers"), where("userId", "==", userId)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as InsuranceBroker;
}

// ── Get all verified brokers (public directory) ──────────────────────
export async function getVerifiedBrokers(specialty?: string): Promise<InsuranceBroker[]> {
  const snap = await getDocs(query(collection(db, "insuranceBrokers"), where("verified", "==", true)));
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as InsuranceBroker));
  if (specialty && specialty !== "All") {
    results = results.filter(b => b.specialties.includes(specialty));
  }
  return results;
}
