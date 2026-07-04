// components/ProtectedRoute.tsx
// ─── ROUTE GUARD ────────────────────────────────────────────────
// Wraps any page that requires authentication.
// Optionally restrict to a specific role, and/or require phone verification.

"use client";

import { useEffect }  from "react";
import { useRouter }  from "next/router";
import { useAuth }    from "@/context/AuthContext";

interface Props {
  children:            React.ReactNode;
  requireRole?:        "buyer" | "seller" | "admin";
  requirePhoneVerified?: boolean;
}

export default function ProtectedRoute({ children, requireRole, requirePhoneVerified }: Props) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth/login?redirect=" + router.pathname);
      return;
    }

    if (requireRole && userDoc?.role !== requireRole) {
      router.push("/");
      return;
    }

    if (requirePhoneVerified && !userDoc?.phoneVerified) {
      router.push("/auth/verify-phone?redirect=" + router.pathname);
      return;
    }
  }, [user, userDoc, loading, requireRole, requirePhoneVerified, router]);

  // Show nothing while loading or redirecting
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rust border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requireRole && userDoc?.role !== requireRole) return null;
  if (requirePhoneVerified && !userDoc?.phoneVerified) return null;

  return <>{children}</>;
}
