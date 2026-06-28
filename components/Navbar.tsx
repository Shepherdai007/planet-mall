// components/Navbar.tsx
"use client";

import Link             from "next/link";
import { useState, useEffect } from "react";
import { useRouter }    from "next/router";
import { useAuth }      from "@/context/AuthContext";
import { useCart }      from "@/context/CartContext";
import { logout }       from "@/lib/auth";
import toast            from "react-hot-toast";
import NotificationBell from "./NotificationBell";
import { listenConversations } from "@/services/messageService";

export default function Navbar() {
  const { user, userDoc, isLoggedIn, isSeller } = useAuth();
  const { itemCount, openCart }                  = useCart();
  const router  = useRouter();
  const [profileOpen,     setProfileOpen]     = useState(false);
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [unreadMessages,  setUnreadMessages]  = useState(0);

  // Listen for unread messages
  useEffect(() => {
    if (!user) { setUnreadMessages(0); return; }
    const unsub = listenConversations(user.uid, convs => {
      const total = convs.reduce((sum, c) => {
        const isSeller = user.uid === c.sellerId;
        return sum + (isSeller ? c.unreadSeller || 0 : c.unreadBuyer || 0);
      }, 0);
      setUnreadMessages(total);
    });
    return unsub;
  }, [user]);

  async function handleLogout() {
    try {
      await logout();
      toast.success("Signed out");
      router.push("/");
    } catch {
      toast.error("Sign out failed");
    }
  }

  const NAV_LINKS = [
    { href:"/explore",          label:"Explore" },
    { href:"/classifieds",      label:"Classifieds" },
    { href:"/food",             label:"🍽 Food" },
    { href:"/jobs",             label:"💼 Jobs" },
    { href:"/predictions",      label:"🏆 Predictions" },
    { href:"/rooms",            label:"🏠 Rooms" },
    { href:"/livestreams",      label:"🔴 Live" },
    { href:"/messages",         label:"Messages" },
    { href:"/pricing",          label:"Pricing" },
    ...(isSeller ? [{ href:"/seller/dashboard", label:"Dashboard" }] : []),
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-void/90 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="Planet Mall" className="w-9 h-9 rounded-lg object-cover" />
            <span className="font-syne font-bold text-lg text-paper tracking-tight hidden sm:block">Planet Mall</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-dm-sans text-muted">
            {NAV_LINKS.map(({href,label}) => (
              <Link key={href} href={href} className="relative hover:text-paper transition-colors">
                {label}
                {label === "Messages" && unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-3 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{background:"#C4531A"}}>
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn && <NotificationBell />}

            {/* Cart */}
            <button onClick={openCart} className="relative p-2 text-muted hover:text-paper" aria-label="Cart">
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

            {/* Profile dropdown */}
            {isLoggedIn ? (
              <div className="relative">
                <button onClick={() => setProfileOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors">
                  {userDoc?.photoURL
                    ? <img src={userDoc.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                    : <span className="w-5 h-5 bg-rust/20 text-rust rounded-full flex items-center justify-center text-xs font-bold">
                        {userDoc?.displayName?.[0]?.toUpperCase() || "U"}
                      </span>}
                  <span className="text-sm font-dm-sans text-paper hidden sm:block">
                    {userDoc?.displayName?.split(" ")[0] || "Account"}
                  </span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#141210] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs text-muted">{userDoc?.email}</p>
                      <span className="px-1.5 py-0.5 rounded bg-rust/20 text-rust text-[10px] font-semibold uppercase tracking-wide mt-0.5 inline-block">
                        {userDoc?.role}
                      </span>
                    </div>
                    <Link href="/profile" className="block px-4 py-2.5 text-sm text-paper/80 hover:bg-white/5" onClick={() => setProfileOpen(false)}>Profile</Link>
                    {isSeller && (
                      <Link href="/seller/dashboard" className="block px-4 py-2.5 text-sm text-paper/80 hover:bg-white/5" onClick={() => setProfileOpen(false)}>Seller Dashboard</Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5">Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="px-4 py-2 bg-rust text-white text-sm font-dm-sans font-medium rounded-full hover:bg-rust/90 transition-colors">
                Sign in
              </Link>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 text-muted hover:text-paper" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              {mobileOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-void/95 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map(({href,label}) => (
                <Link key={href} href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-dm-sans text-muted hover:text-paper hover:bg-white/5 transition-all"
                  style={{color: router.pathname === href ? "#C4531A" : undefined}}>
                  {label}
                  {label === "Messages" && unreadMessages > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{background:"#C4531A"}}>
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-white/5">
                <Link href="/classifieds/post" onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-dm-sans font-semibold text-white"
                  style={{background:"#C4531A"}}>
                  + Post free ad
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
