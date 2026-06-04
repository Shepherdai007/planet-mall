// components/Navbar.tsx
// ─── MAIN NAVIGATION ────────────────────────────────────────────
// Phase 1 design: dark void background, Syne font, rust accent.
// Shows auth state — sign in / profile + role badge.

"use client";

import Link             from "next/link";
import { useState }     from "react";
import { useRouter }    from "next/router";
import { useAuth }      from "@/context/AuthContext";
import { useCart }      from "@/context/CartContext";
import { logout }       from "@/lib/auth";
import toast            from "react-hot-toast";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, userDoc, isLoggedIn, isSeller } = useAuth();
  const { itemCount, openCart }                  = useCart();
  const router  = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      toast.success("Signed out");
      router.push("/");
    } catch {
      toast.error("Sign out failed");
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-void/90 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Planet Mall" className="w-9 h-9 rounded-lg object-cover" />
          <span className="font-syne font-bold text-lg text-paper tracking-tight hidden sm:block">
            Planet Mall
          </span>
        </Link>

        {/* ── Desktop nav links ─────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-6 text-sm font-dm-sans text-muted">
          <Link href="/explore" className="hover:text-paper transition-colors">
            Explore
          </Link>
          <Link href="/pricing" className="hover:text-paper transition-colors">
            Pricing
          </Link>
          <Link href="/messages" className="hover:text-paper transition-colors">
            Messages
          </Link>
          <Link href="/livestreams" className="hover:text-paper transition-colors flex items-center gap-1">
            <span className="w-2 h-2 bg-green rounded-full animate-pulse-dot" />
            Live
          </Link>
          {isSeller && (
            <Link href="/seller/dashboard" className="hover:text-paper transition-colors">
              Dashboard
            </Link>
          )}
        </div>

        {/* ── Right actions ─────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          {isLoggedIn && <NotificationBell />}

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative p-2 text-muted hover:text-paper transition-colors"
            aria-label="Cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <path d="M3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
            {itemCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rust text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {/* Auth */}
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors"
              >
                {userDoc?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userDoc.photoURL}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-5 h-5 bg-rust/20 text-rust rounded-full flex items-center justify-center text-xs font-bold">
                    {userDoc?.displayName?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
                <span className="text-sm font-dm-sans text-paper hidden sm:block">
                  {userDoc?.displayName?.split(" ")[0] || "Account"}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#141210] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs text-muted">{userDoc?.email}</p>
                    <p className="text-xs mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-rust/20 text-rust text-[10px] font-semibold uppercase tracking-wide">
                        {userDoc?.role}
                      </span>
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2.5 text-sm text-paper/80 hover:bg-white/5 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {isSeller && (
                    <Link
                      href="/seller/dashboard"
                      className="block px-4 py-2.5 text-sm text-paper/80 hover:bg-white/5 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Seller Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-rust text-white text-sm font-dm-sans font-medium rounded-full hover:bg-rust/90 transition-colors"
            >
              Sign in
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-muted hover:text-paper"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
