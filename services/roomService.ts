// services/roomService.ts
// ─── PLANET ROOMS — PAID GROUP CHAT ROOMS ────────────────────────
// Rooms are paid communities. Owner sets a monthly price.
// Members pay via Stripe. Planet Mall takes 10% commission.
// Chat messages in /rooms/{roomId}/messages/{msgId}
// Members in /rooms/{roomId}/members/{userId}

import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, onSnapshot, serverTimestamp, setDoc, deleteDoc, increment,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const ROOM_COMMISSION = 0.10; // 10%

export const ROOM_CATEGORIES = [
  "Sports & Betting", "Business & Finance", "Education",
  "Entertainment", "Health & Fitness", "Technology",
  "Music & Arts", "Gaming", "Faith & Spirituality", "Other",
];

// ── Interfaces ────────────────────────────────────────────────────
export interface Room {
  id?:           string;
  ownerId:       string;
  ownerName:     string;
  ownerPhoto:    string;
  name:          string;
  description:   string;
  category:      string;
  photo:         string;
  price:         number;       // monthly price in CAD
  currency:      string;       // "CAD"
  commission:    number;       // 10% of price
  ownerPayout:   number;       // price - commission
  agoraChannel:  string;       // for voice/video calls
  memberCount:   number;
  isPrivate:     boolean;
  status:        "active" | "closed";
  createdAt:     unknown;
}

export interface RoomMember {
  userId:       string;
  userName:     string;
  userPhoto:    string;
  role:         "owner" | "member";
  joinedAt:     unknown;
  expiresAt:    unknown;       // 30 days from payment
  stripeSessionId?: string;
}

export interface RoomMessage {
  id?:         string;
  userId:      string;
  userName:    string;
  userPhoto:   string;
  text:        string;
  type:        "text" | "join" | "leave";
  createdAt:   unknown;
}

// ── Create a room ─────────────────────────────────────────────────
export async function createRoom(data: Omit<Room, "id" | "createdAt" | "memberCount" | "commission" | "ownerPayout" | "agoraChannel">): Promise<string> {
  const commission  = Math.round(data.price * ROOM_COMMISSION * 100) / 100;
  const ownerPayout = Math.round((data.price - commission) * 100) / 100;
  const agoraChannel = `room_${Date.now()}`.slice(0, 64);

  const ref = await addDoc(collection(db, "rooms"), {
    ...data,
    commission,
    ownerPayout,
    agoraChannel,
    memberCount: 1, // owner counts as member
    status:      "active",
    createdAt:   serverTimestamp(),
  });

  // Add owner as first member
  await setDoc(doc(db, "rooms", ref.id, "members", data.ownerId), {
    userId:    data.ownerId,
    userName:  data.ownerName,
    userPhoto: data.ownerPhoto,
    role:      "owner",
    joinedAt:  serverTimestamp(),
    expiresAt: null, // owner never expires
  } as RoomMember);

  return ref.id;
}

// ── Get all active rooms ──────────────────────────────────────────
export async function getAllRooms(category?: string): Promise<Room[]> {
  const snap = await getDocs(query(collection(db, "rooms"), where("status", "==", "active")));
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Room));
  if (category && category !== "All") {
    results = results.filter(r => r.category === category);
  }
  results.sort((a: any, b: any) => (b.memberCount || 0) - (a.memberCount || 0));
  return results;
}

// ── Get single room ───────────────────────────────────────────────
export async function getRoom(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, "rooms", roomId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Room;
}

// ── Check if user is a member ─────────────────────────────────────
export async function isMember(roomId: string, userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "rooms", roomId, "members", userId));
  if (!snap.exists()) return false;
  const member = snap.data() as RoomMember;
  // Check expiry for non-owners
  if (member.role === "owner") return true;
  if (!member.expiresAt) return false;
  const expires = (member.expiresAt as any).toDate?.() || new Date(member.expiresAt as any);
  return expires > new Date();
}

// ── Add member after payment ──────────────────────────────────────
export async function addMember(roomId: string, member: Omit<RoomMember, "joinedAt" | "expiresAt"> & { stripeSessionId: string }): Promise<void> {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30-day access

  await setDoc(doc(db, "rooms", roomId, "members", member.userId), {
    ...member,
    role:      "member",
    joinedAt:  serverTimestamp(),
    expiresAt: expires,
  });
  await updateDoc(doc(db, "rooms", roomId), { memberCount: increment(1) });

  // System message
  await addDoc(collection(db, "rooms", roomId, "messages"), {
    userId:    member.userId,
    userName:  member.userName,
    userPhoto: member.userPhoto,
    text:      `${member.userName} joined the room 🎉`,
    type:      "join",
    createdAt: serverTimestamp(),
  });
}

// ── Send a message ────────────────────────────────────────────────
export async function sendRoomMessage(roomId: string, message: Omit<RoomMessage, "id" | "createdAt">): Promise<void> {
  await addDoc(collection(db, "rooms", roomId, "messages"), {
    ...message,
    createdAt: serverTimestamp(),
  });
}

// ── Listen to messages ────────────────────────────────────────────
export function listenRoomMessages(roomId: string, callback: (messages: RoomMessage[]) => void): Unsubscribe {
  return onSnapshot(collection(db, "rooms", roomId, "messages"), snap => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as RoomMessage));
    msgs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    callback(msgs.slice(-100));
  });
}

// ── Listen to members ─────────────────────────────────────────────
export function listenRoomMembers(roomId: string, callback: (members: RoomMember[]) => void): Unsubscribe {
  return onSnapshot(collection(db, "rooms", roomId, "members"), snap => {
    const members = snap.docs.map(d => d.data() as RoomMember);
    members.sort((a: any, b: any) => (a.joinedAt?.seconds || 0) - (b.joinedAt?.seconds || 0));
    callback(members);
  });
}

// ── Get owner's rooms ─────────────────────────────────────────────
export async function getMyRooms(userId: string): Promise<Room[]> {
  const snap = await getDocs(query(collection(db, "rooms"), where("ownerId", "==", userId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Room));
}
