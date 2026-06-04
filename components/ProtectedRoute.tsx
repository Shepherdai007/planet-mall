// components/ProtectedRoute.tsx
// ─── ROUTE GUARD ────────────────────────────────────────────────
// Wraps any page that requires authentication.
// Optionally restrict to a specific role.

"use client";

import { useEffect }  from "react";
import { useRouter }  from "next/router";
import { useAuth }    from "@/context/AuthContext";

interface Props {
  children:     React.ReactNode;
  requireRole?: "buyer" | "seller" | "admin";
}

export default function ProtectedRoute({ children, requireRole }: Props) {
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
    }
  }, [user, userDoc, loading, requireRole, router]);

  // Show nothing while loading or redirecting
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rust border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requireRole && userDoc?.role !== requireRole) return null;

  return <>{children}</>;
}
