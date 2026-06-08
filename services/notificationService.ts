// services/notificationService.ts
// ─── NOTIFICATION FIRESTORE OPERATIONS ──────────────────────────
// Notifications stored at /notifications/{uid}/items/{notifId}
// Types: new_order, new_message, new_follower, stream_live,
//        review, payment, system

import {
  collection, addDoc, updateDoc, doc, onSnapshot,
  query, where, serverTimestamp, type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Notification {
  id?:       string;
  userId:    string;
  type:      "new_order" | "new_message" | "new_follower" | "stream_live" | "review" | "payment" | "system";
  title:     string;
  body:      string;
  link?:     string;
  read:      boolean;
  createdAt: unknown;
}

// ── Create a notification (server-side / admin only in prod) ──────
export async function createNotification(notif: Omit<Notification, "id" | "createdAt" | "read">): Promise<void> {
  await addDoc(collection(db, "notifications", notif.userId, "items"), {
    ...notif,
    read:      false,
    createdAt: serverTimestamp(),
  });
}

// ── Mark notification as read ─────────────────────────────────────
export async function markNotificationRead(userId: string, notifId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", userId, "items", notifId), { read: true });
}

// ── Listen to notifications in real time ─────────────────────────
export function listenNotifications(
  userId: string,
  callback: (notifs: Notification[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, "notifications", userId, "items"),
    snap => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      notifs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(notifs.slice(0, 50));
    }
  );
}

// ── Mark all notifications as read ───────────────────────────────
export async function markAllNotificationsRead(userId: string, notifIds: string[]): Promise<void> {
  await Promise.all(
    notifIds.map(id => updateDoc(doc(db, "notifications", userId, "items", id), { read: true }))
  );
}
