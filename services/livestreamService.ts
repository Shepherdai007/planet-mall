// services/livestreamService.ts
// ─── LIVESTREAM FIRESTORE OPERATIONS ────────────────────────────
// Streams are stored in /livestreams/{streamId}
// Live chat messages in /livestreams/{streamId}/chat/{msgId}
// Pinned products in /livestreams/{streamId}/pinnedProducts/{productId}

import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, onSnapshot, serverTimestamp, setDoc, deleteDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface LiveStream {
  streamId?:     string;
  shopId:        string;
  ownerId:       string;
  shopName:      string;
  shopLogo:      string;
  title:         string;
  description:   string;
  thumbnailURL:  string;
  agoraChannel:  string;  // unique channel name for Agora RTC
  status:        "scheduled" | "live" | "ended";
  viewerCount:   number;
  peakViewers:   number;
  totalHearts:   number;
  startedAt:     unknown;
  endedAt:       unknown | null;
  pinnedProductId: string | null;
}

export interface LiveChatMessage {
  id?:         string;
  userId:      string;
  userName:    string;
  userPhoto:   string;
  text:        string;
  type:        "message" | "heart" | "join" | "product_pin";
  createdAt:   unknown;
}

export interface PinnedProduct {
  productId:  string;
  name:       string;
  price:      number;
  image:      string;
  currency:   string;
  pinnedAt:   unknown;
}

// ── Generate unique Agora channel name ───────────────────────────
export function generateChannelName(shopId: string): string {
  return `pm_${shopId}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 64);
}

// ── Start a new livestream ────────────────────────────────────────
export async function startLiveStream(data: Omit<LiveStream, "streamId" | "startedAt" | "endedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "livestreams"), {
    ...data,
    startedAt:   serverTimestamp(),
    endedAt:     null,
    createdAt:   serverTimestamp(),
  });
  await updateDoc(ref, { streamId: ref.id });
  return ref.id;
}

// ── End a livestream ──────────────────────────────────────────────
export async function endLiveStream(streamId: string): Promise<void> {
  await updateDoc(doc(db, "livestreams", streamId), {
    status:  "ended",
    endedAt: serverTimestamp(),
  });
}

// ── Update viewer count ───────────────────────────────────────────
export async function updateViewerCount(streamId: string, count: number): Promise<void> {
  const ref  = doc(db, "livestreams", streamId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const peak = snap.data().peakViewers || 0;
  await updateDoc(ref, {
    viewerCount: count,
    peakViewers: Math.max(peak, count),
  });
}

// ── Pin a product to stream ───────────────────────────────────────
export async function pinProduct(streamId: string, product: PinnedProduct): Promise<void> {
  await setDoc(doc(db, "livestreams", streamId, "pinnedProducts", product.productId), {
    ...product,
    pinnedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "livestreams", streamId), {
    pinnedProductId: product.productId,
  });
}

// ── Unpin product ─────────────────────────────────────────────────
export async function unpinProduct(streamId: string, productId: string): Promise<void> {
  await deleteDoc(doc(db, "livestreams", streamId, "pinnedProducts", productId));
  await updateDoc(doc(db, "livestreams", streamId), { pinnedProductId: null });
}

// ── Send live chat message ────────────────────────────────────────
export async function sendLiveChatMessage(
  streamId: string,
  message: Omit<LiveChatMessage, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, "livestreams", streamId, "chat"), {
    ...message,
    createdAt: serverTimestamp(),
  });
}

// ── Listen to live chat ───────────────────────────────────────────
export function listenLiveChat(
  streamId: string,
  callback: (messages: LiveChatMessage[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, "livestreams", streamId, "chat"),
    snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveChatMessage));
      msgs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      // Keep last 100 messages only
      callback(msgs.slice(-100));
    }
  );
}

// ── Listen to a stream ────────────────────────────────────────────
export function listenStream(
  streamId: string,
  callback: (stream: LiveStream | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "livestreams", streamId), snap => {
    if (!snap.exists()) { callback(null); return; }
    callback({ streamId: snap.id, ...snap.data() } as LiveStream);
  });
}

// ── Listen to all live streams ────────────────────────────────────
export function listenLiveStreams(
  callback: (streams: LiveStream[]) => void
): Unsubscribe {
  const q = query(collection(db, "livestreams"), where("status", "==", "live"));
  return onSnapshot(q, snap => {
    const streams = snap.docs.map(d => ({ streamId: d.id, ...d.data() } as LiveStream));
    streams.sort((a: any, b: any) => (b.startedAt?.seconds || 0) - (a.startedAt?.seconds || 0));
    callback(streams);
  });
}

// ── Listen to pinned product ──────────────────────────────────────
export function listenPinnedProduct(
  streamId: string,
  productId: string,
  callback: (product: PinnedProduct | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "livestreams", streamId, "pinnedProducts", productId),
    snap => {
      if (!snap.exists()) { callback(null); return; }
      callback(snap.data() as PinnedProduct);
    }
  );
}
