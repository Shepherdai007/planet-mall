// pages/seller/payouts.tsx
// ─── SELLER PAYOUTS — STRIPE CONNECT SETUP ──────────────────────
// Sellers land here to connect their bank account via Stripe Express.
// Until this is done, their shop stays hidden from buyers on Explore.

import Head            from "next/head";
import Link            from "next/link";
import { useRouter }   from "next/router";
import { useState, useEffect } from "react";
import toast            from "react-hot-toast";
import ProtectedRoute   from "@/components/ProtectedRoute";
import { useAuth }      from "@/context/AuthContext";
import { getShopByOwner } from "@/services/shopService";
import type { ShopData } from "@/services/shopService";

export default function PayoutsPage() {
  return (
    <ProtectedRoute requireRole="seller">
      <Payouts />
    </ProtectedRoute>
  );
}

function Payouts() {
  const { user } = useAuth();
  const router   = useRouter();
  const { onboarded, refresh } = router.query;

  const [shop,       setShop]       = useState<ShopData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [checking,   setChecking]   = useState(false);

  useEffect(() => {
    if (!user) return;
    getShopByOwner(user.uid).then(s => {
      setShop(s);
      setLoading(false);
    });
  }, [user]);

  // If the seller just came back from Stripe (either finished or hit refresh),
  // re-check their real status with Stripe and update Firestore.
  useEffect(() => {
    if (!shop?.shopId) return;
    if (!onboarded && !refresh) return;
    setChecking(true);
    fetch("/api/stripe/connect-status", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ shopId: shop.shopId }),
    })
      .then(res => res.json())
      .then(data => {
        setShop(s => s ? { ...s, payoutsEnabled: data.payoutsEnabled, detailsSubmitted: data.detailsSubmitted } : s);
        if (data.payoutsEnabled) {
          toast.success("Payout account connected! Your store is now live 🎉");
        } else if (onboarded) {
          toast.error("Stripe still needs more info before payouts can start.");
        }
      })
      .finally(() => setChecking(false));
  }, [shop?.shopId, onboarded, refresh]);

  async function handleConnect() {
    if (!user || !shop?.shopId) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect-onboard", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ shopId: shop.shopId, email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start onboarding");
      window.location.href = data.url; // Stripe-hosted onboarding page
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setConnecting(false);
    }
  }

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"#F6F1E9"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    );
  }

  const isLive = !!shop?.payoutsEnabled;

  return (
    <>
      <Head><title>Payouts — {shop?.name || "Planet Mall"}</title></Head>
      <div className="min-h-screen" style={{background:"#F6F1E9",color:"#1A1714"}}>
        <div className="max-w-2xl mx-auto px-4 pt-10 pb-16">

          <Link href="/seller/dashboard" className="inline-flex items-center gap-1 text-sm font-dm-sans mb-6"
            style={{color:"#8A8480"}}>
            ← Back to dashboard
          </Link>

          <h1 className="font-syne font-bold text-3xl mb-1">Payouts</h1>
          <p className="text-sm font-dm-sans mb-8" style={{color:"#8A8480"}}>
            Connect your bank account so you get paid automatically for every sale.
          </p>

          {isLive ? (
            /* ── Connected state ─────────────────────────────── */
            <div className="p-6 rounded-2xl mb-6" style={{background:"#fff",border:"2px solid #2A6B45"}}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-syne font-bold text-lg" style={{color:"#2A6B45"}}>Payouts connected</p>
                  <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>
                    Your store is live and can accept payments. Stripe pays you out automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ── BIG RED WARNING ─────────────────────────────── */
            <div className="p-6 rounded-2xl mb-6" style={{background:"#FDECEC",border:"2px solid #D92D20"}}>
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">🔴</span>
                <div>
                  <p className="font-syne font-bold text-lg" style={{color:"#D92D20"}}>
                    Your store is NOT live yet
                  </p>
                  <p className="text-sm font-dm-sans mt-1" style={{color:"#7A1F17"}}>
                    Buyers cannot see or buy from your store until you connect your bank account.
                    This takes about 5 minutes — Stripe handles it securely.
                  </p>
                </div>
              </div>
              <button onClick={handleConnect} disabled={connecting}
                className="w-full py-3.5 rounded-xl text-white font-dm-sans font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#D92D20"}}>
                {connecting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Redirecting to Stripe...</>
                  : "Connect payout account now →"}
              </button>
            </div>
          )}

          {/* Info box */}
          <div className="p-5 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
            <p className="font-syne font-bold text-sm mb-2">How payouts work</p>
            <ul className="space-y-1.5 text-sm font-dm-sans" style={{color:"#8A8480"}}>
              <li>• You keep 85% of every sale — Planet Mall's 15% fee is taken automatically</li>
              <li>• Money goes straight to your bank account — no manual transfers, ever</li>
              <li>• Stripe verifies your identity to keep your money safe</li>
              <li>• Your store stays hidden from buyers until this is complete</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
