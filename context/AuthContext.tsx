// context/AuthContext.tsx
// ─── GLOBAL AUTH STATE ──────────────────────────────────────────
// Wraps the whole app. Provides: user, userDoc, loading, isLoggedIn.
// Import useAuth() hook instead of consuming this context directly.

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot }               from "firebase/firestore";
import { auth, db }                       from "@/lib/firebase";

// ── Firestore user document shape ────────────────────────────────
export interface UserDoc {
  uid:         string;
  email:       string;
  displayName: string;
  photoURL:    string;
  role:        "buyer" | "seller" | "admin";
  phone:       string;
  city:        string;
  country:     string;
  createdAt:   unknown; // Firestore Timestamp
  lastSeen:    unknown;
}

// ── Subscription document shape ───────────────────────────────────
export interface Subscription {
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?:  any;
  stripeSubscriptionId?: string;
  uid:    string;
  plan:   "free" | "premium" | "business";
  status: "active" | "cancelled" | "expired";
}

interface AuthContextValue {
  user:         User | null;
  userDoc:      UserDoc | null;
  subscription: Subscription | null;
  loading:      boolean;
  isLoggedIn:   boolean;
  isSeller:     boolean;
  isPremium:    boolean;
  isBusiness:   boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user:         null,
  userDoc:      null,
  subscription: null,
  loading:      true,
  isLoggedIn:   false,
  isSeller:     false,
  isPremium:    false,
  isBusiness:   false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,         setUser]         = useState<User | null>(null);
  const [userDoc,      setUserDoc]      = useState<UserDoc | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserDoc(null);
        setSubscription(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to user document in real-time
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserDoc(snap.data() as UserDoc);
    });

    // Listen to subscription in real-time
    const unsubSub = onSnapshot(doc(db, "subscriptions", user.uid), (snap) => {
      if (snap.exists()) setSubscription(snap.data() as Subscription);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubSub();
    };
  }, [user]);

  const isLoggedIn = !!user;
  const isSeller   = userDoc?.role === "seller";
  const isPremium  =
    subscription?.plan === "premium" && subscription?.status === "active";
  const isBusiness =
    subscription?.plan === "business" && subscription?.status === "active";

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        subscription,
        loading,
        isLoggedIn,
        isSeller,
        isPremium,
        isBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
