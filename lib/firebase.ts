// lib/firebase.ts
// ─── CLIENT-SIDE FIREBASE INIT ──────────────────────────────────
// Safe to import in pages and components.
// Never import firebase-admin from here — server only.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth }                          from "firebase/auth";
import { getFirestore }                     from "firebase/firestore";
import { getStorage }                       from "firebase/storage";
import { getMessaging, isSupported }        from "firebase/messaging";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Prevent duplicate initialization in Next.js hot reload
const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const storage = getStorage(app);

// FCM is browser-only — must be guarded
const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};

export { app, auth, db, storage, getMessagingInstance };
