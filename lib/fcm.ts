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
  if (!("serviceWorker" in navigator)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // Register service worker — if it fails, skip FCM silently
    let swRegistration: ServiceWorkerRegistration | undefined;
    try {
      swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;
    } catch {
      return null; // No service worker — skip FCM, don't crash
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey:                  VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) return null;

    await setDoc(doc(db, "fcmTokens", userId), {
      token,
      userId,
      platform:  "web",
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return token;
  } catch (err) {
    console.error("FCM init error:", err);
    return null; // Never crash the app
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
