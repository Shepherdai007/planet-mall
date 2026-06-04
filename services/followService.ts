// services/followService.ts
// ─── FOLLOW / SUBSCRIBE SYSTEM ───────────────────────────────────
// Buyers follow sellers/shops.
// When seller goes live → all followers get notified instantly.
// Stored in /follows/{shopId}/followers/{userId}

import {
  doc, setDoc, deleteDoc, getDoc, getDocs,
  collection, query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Follow a shop ─────────────────────────────────────────────────
export async function followShop(
  userId:    string,
  userName:  string,
  shopId:    string,
  shopName:  string,
): Promise<void> {
  await setDoc(doc(db, "follows", shopId, "followers", userId), {
    userId, userName, shopId, shopName,
    followedAt: serverTimestamp(),
  });
  // Update shop follower count
  const shopRef  = doc(db, "shops", shopId);
  const shopSnap = await getDoc(shopRef);
  if (shopSnap.exists()) {
    const current = shopSnap.data().followers || 0;
    await setDoc(shopRef, { followers: current + 1 }, { merge: true });
  }
}

// ── Unfollow a shop ───────────────────────────────────────────────
export async function unfollowShop(userId: string, shopId: string): Promise<void> {
  await deleteDoc(doc(db, "follows", shopId, "followers", userId));
  const shopRef  = doc(db, "shops", shopId);
  const shopSnap = await getDoc(shopRef);
  if (shopSnap.exists()) {
    const current = shopSnap.data().followers || 1;
    await setDoc(shopRef, { followers: Math.max(0, current - 1) }, { merge: true });
  }
}

// ── Check if user follows a shop ──────────────────────────────────
export async function isFollowing(userId: string, shopId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "follows", shopId, "followers", userId));
  return snap.exists();
}

// ── Get all followers of a shop ───────────────────────────────────
export async function getShopFollowers(shopId: string): Promise<string[]> {
  const snap = await getDocs(collection(db, "follows", shopId, "followers"));
  return snap.docs.map(d => d.id);
}

// ── Notify all followers when seller goes live ────────────────────
// Called from seller/livestream.tsx when stream starts
export async function notifyFollowersLive(
  shopId:     string,
  shopName:   string,
  streamId:   string,
  streamTitle: string,
): Promise<void> {
  const followerIds = await getShopFollowers(shopId);
  const now = new Date();

  await Promise.all(followerIds.map(userId =>
    setDoc(doc(db, "notifications", userId, "items", `live_${streamId}`), {
      userId,
      type:      "stream_live",
      title:     `${shopName} is live! 🔴`,
      body:      streamTitle,
      link:      `/live/${streamId}`,
      read:      false,
      createdAt: now,
    })
  ));
}
