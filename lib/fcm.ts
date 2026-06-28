// lib/fcm.ts
// ─── FIREBASE CLOUD MESSAGING HELPERS ────────────────────────────
// Gets the user's FCM push token and saves it to Firestore so
// the server can send them push notifications.

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from "@/lib/firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;

// ── Request permission + get FCM token ────────────────────────────
export async function initPushNotifications(userId: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey:          VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-messaging-sw.js"),
    });

    if (!token) return null;

    // Save token to Firestore so API routes can use it to send notifications
    await setDoc(doc(db, "fcmTokens", userId), {
      token,
      userId,
      platform:  "web",
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return token;
  } catch (err) {
    console.error("FCM init error:", err);
    return null;
  }
}

// ── Listen for foreground messages (app is open) ──────────────────
export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === "undefined") return () => {};
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, callback);
  } catch {
    return () => {};
  }
}
