// lib/auth.ts
// ─── AUTH HELPERS ───────────────────────────────────────────────
// Client-side: used by AuthContext and pages.
// For server-side token verification, use firebase-admin.ts.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  type User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ── Google provider ───────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Create user document in Firestore after signup ────────────────
export async function createUserDocument(
  user: User,
  role: "buyer" | "seller",
  displayName?: string
): Promise<void> {
  await setDoc(doc(db, "users", user.uid), {
    uid:         user.uid,
    email:       user.email,
    displayName: displayName || user.displayName || "",
    photoURL:    user.photoURL || "",
    role,
    phone:       user.phoneNumber || "",
    city:        "",
    country:     "",
    createdAt:   serverTimestamp(),
    lastSeen:    serverTimestamp(),
  });

  // Create free subscription by default
  await setDoc(doc(db, "subscriptions", user.uid), {
    uid:              user.uid,
    plan:             "free",
    status:           "active",
    paymentMethod:    null,
    currentPeriodStart: serverTimestamp(),
    currentPeriodEnd:   null,
    cancelAtPeriodEnd: false,
    stripeSubscriptionId:   null,
    paystackSubscriptionCode: null,
  });
}

// ── Email / password signup ───────────────────────────────────────
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: "buyer" | "seller"
): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await createUserDocument(user, role, displayName);
  return user;
}

// ── Email / password sign in ──────────────────────────────────────
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// ── Google sign in ────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<User> {
  const { user } = await signInWithPopup(auth, googleProvider);
  return user;
}

// ── Phone OTP ─────────────────────────────────────────────────────
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

export async function sendOTP(
  phoneNumber: string,
  recaptcha: RecaptchaVerifier
) {
  return signInWithPhoneNumber(auth, phoneNumber, recaptcha);
}

// ── Password reset ────────────────────────────────────────────────
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ── Sign out ──────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await signOut(auth);
}
