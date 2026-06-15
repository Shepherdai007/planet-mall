// services/messageService.ts
// ─── REAL-TIME MESSAGING FIRESTORE OPERATIONS ────────────────────
// Conversations are between a buyer and a seller (shop).
// A conversation ID is always: sorted(uid1, uid2).join("_")
// Messages are subcollection: /conversations/{id}/messages/{msgId}
// Never use .orderBy() on composite fields — sort client-side.

import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, onSnapshot, serverTimestamp, setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Message {
  id?:         string;
  senderId:    string;
  senderName:  string;
  senderPhoto: string;
  text:        string;
  type:        "text" | "product" | "image" | "order";
  productCard?: {
    productId: string;
    name:      string;
    price:     number;
    image:     string;
    currency:  string;
  } | null;
  read:        boolean;
  createdAt:   unknown;
}

export interface Conversation {
  id?:              string;
  participants:     string[];          // [buyerId, sellerId]
  buyerId:          string;
  sellerId:         string;
  buyerName:        string;
  sellerName:       string;
  buyerPhoto:       string;
  sellerPhoto:      string;
  shopId:           string;
  shopName:         string;
  shopLogo:         string;
  listingId?:       string;
  listingTitle?:    string;
  lastMessage:      string;
  lastMessageAt:    unknown;
  lastSenderId:     string;
  unreadBuyer:      number;
  unreadSeller:     number;
}

// ── Generate deterministic conversation ID ────────────────────────
// If listingId provided → one chat per listing per buyer
// Otherwise → one chat per buyer-seller pair
export function getConversationId(uid1: string, uid2: string, listingId?: string): string {
  const base = [uid1, uid2].sort().join("_");
  return listingId ? `${base}_${listingId}` : base;
}

// ── Get or create a conversation ─────────────────────────────────
export async function getOrCreateConversation(
  buyerId:     string,
  buyerName:   string,
  buyerPhoto:  string,
  sellerId:    string,
  sellerName:  string,
  sellerPhoto: string,
  shopId:      string,
  shopName:    string,
  shopLogo:    string,
  listingId?:  string,
  listingTitle?: string,
): Promise<string> {
  const convId = getConversationId(buyerId, sellerId, listingId);
  const ref    = doc(db, "conversations", convId);
  const snap   = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      id: convId,
      participants:  [buyerId, sellerId],
      buyerId, sellerId,
      buyerName, sellerName,
      buyerPhoto, sellerPhoto,
      shopId, shopName, shopLogo,
      listingId:    listingId || "",
      listingTitle: listingTitle || "",
      lastMessage:   "",
      lastMessageAt: serverTimestamp(),
      lastSenderId:  "",
      unreadBuyer:   0,
      unreadSeller:  0,
    } as Conversation);
  }
  return convId;
}

// ── Send a message ────────────────────────────────────────────────
export async function sendMessage(
  conversationId: string,
  message: Omit<Message, "id" | "createdAt" | "read">
): Promise<void> {
  const msgRef = collection(db, "conversations", conversationId, "messages");
  await addDoc(msgRef, {
    ...message,
    read:      false,
    createdAt: serverTimestamp(),
  });

  // Update conversation last message
  const convRef = doc(db, "conversations", conversationId);
  const conv    = await getDoc(convRef);
  if (conv.exists()) {
    const data = conv.data() as Conversation;
    const isSeller = message.senderId === data.sellerId;
    await updateDoc(convRef, {
      lastMessage:   message.text || (message.type === "product" ? "📦 Shared a product" : "📎 Attachment"),
      lastMessageAt: serverTimestamp(),
      lastSenderId:  message.senderId,
      // Increment unread for the OTHER person
      unreadBuyer:   isSeller ? (data.unreadBuyer || 0) + 1 : 0,
      unreadSeller:  !isSeller ? (data.unreadSeller || 0) + 1 : 0,
    });
  }
}

// ── Listen to messages in real time ──────────────────────────────
export function listenMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = collection(db, "conversations", conversationId, "messages");
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    // Sort client-side — avoids composite index
    msgs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    callback(msgs);
  });
}

// ── Listen to all conversations for a user ────────────────────────
export function listenConversations(
  userId: string,
  callback: (convs: Conversation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId)
  );
  return onSnapshot(q, snap => {
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
    convs.sort((a: any, b: any) =>
      (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0)
    );
    callback(convs);
  });
}

// ── Mark conversation as read ─────────────────────────────────────
export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  const convRef = doc(db, "conversations", conversationId);
  const snap    = await getDoc(convRef);
  if (!snap.exists()) return;
  const data = snap.data() as Conversation;
  const isSeller = userId === data.sellerId;
  await updateDoc(convRef, {
    unreadBuyer:  isSeller  ? data.unreadBuyer  : 0,
    unreadSeller: !isSeller ? data.unreadSeller : 0,
  });
}
