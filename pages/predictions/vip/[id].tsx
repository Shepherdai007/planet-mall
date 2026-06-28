// pages/predictions/vip/[id].tsx
// ─── VIP PICK DETAIL + PURCHASE ───────────────────────────────────

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useState, useEffect } from "react";
import toast           from "react-hot-toast";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import { getVIPPick, hasPurchasedPick, confirmPickDelivery, getMyPurchases } from "@/services/predictionService";
import type { VIPPick, PickPurchase } from "@/services/predictionService";

export default function VIPPickDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, userDoc, isLoggedIn } = useAuth();

  const [pick,      setPick]      = useState<VIPPick|null>(null);
  const [loading,   setLoading]   = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [purchase,  setPurchase]  = useState<PickPurchase|null>(null);
  const [paying,    setPaying]    = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;
    getVIPPick(id as string).then(p => { setPick(p); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    hasPurchasedPick(id as string, user.uid).then(setPurchased);
    getMyPurchases(user.uid).then(purchases => {
      const p = purchases.find(p => p.pickId === id);
      if (p) setPurchase(p);
    });
  }, [user, id]);

  async function handleBuy() {
    if (!isLoggedIn || !user || !userDoc) { router.push(`/auth/login?redirect=/predictions/vip/${id}`); return; }
    if (!pick) return;
    setPaying(true);
    try {
      const res = await fetch("/api/stripe/create-onetime-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          product: "vip_pick",
          userId:  user.uid,
          email:   user.email,
          refId:   pick.id,
          amount:  Math.round(pick.price * 100),
          currency: pick.currency.toLowerCase(),
          name:    pick.title,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setPaying(false);
    }
  }

  async function handleConfirmDelivery() {
    if (!purchase) return;
    setConfirming(true);
    try {
      await confirmPickDelivery(purchase.id!);
      setPurchase({ ...purchase, escrowStatus: "released" });
      toast.success("Confirmed! Payment released to tipster ⚡");
    } catch {
      toast.error("Failed to confirm delivery");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#0A0908"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#D4A84B"}} />
      </div>
    </Layout>
  );

  if (!pick) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center text-center px-4" style={{background:"#0A0908"}}>
        <div>
          <p className="text-4xl mb-4">⭐</p>
          <p className="font-dm-sans text-muted">Pick not found</p>
          <Link href="/predictions" className="mt-4 inline-block text-sm font-dm-sans" style={{color:"#C4531A"}}>← Back to predictions</Link>
        </div>
      </div>
    </Layout>
  );

  const isOwner = user?.uid === pick.tipsterId;

  return (
    <>
      <Head><title>{pick.title} — Planet Mall VIP Picks</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#0A0908"}}>
          <div className="max-w-xl mx-auto pt-6">

            <Link href="/predictions" className="inline-flex items-center gap-1 text-sm font-dm-sans mb-6" style={{color:"#8A8480"}}>
              ← Back to predictions
            </Link>

            {/* Tipster */}
            <Link href={`/predictions/tipster/${pick.tipsterId}`}>
              <div className="flex items-center gap-3 mb-5 p-4 rounded-2xl" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold" style={{background:"rgba(212,168,75,0.2)",color:"#D4A84B"}}>
                  {pick.tipsterPhoto ? <img src={pick.tipsterPhoto} alt="" className="w-full h-full object-cover" /> : pick.tipsterName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-dm-sans font-semibold text-paper">{pick.tipsterName}</p>
                    {pick.verified && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{background:"rgba(42,107,69,0.2)",color:"#2A6B45"}}>✓ Verified</span>}
                  </div>
                  <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>{pick.sport} · {pick.matchDate}</p>
                </div>
              </div>
            </Link>

            {/* Pick details */}
            <div className="p-6 rounded-2xl mb-4" style={{background:"linear-gradient(135deg,rgba(212,168,75,0.08),rgba(196,83,26,0.04))",border:"1px solid rgba(212,168,75,0.2)"}}>
              <h1 className="font-syne font-bold text-2xl text-paper mb-3">{pick.title}</h1>
              <p className="font-dm-sans text-sm mb-4" style={{color:"#8A8480"}}>{pick.description}</p>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-full font-dm-sans" style={{background:"rgba(255,255,255,0.04)",color:"#8A8480"}}>{pick.sport}</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-dm-sans" style={{background:"rgba(255,255,255,0.04)",color:"#8A8480"}}>📅 {pick.matchDate}</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-dm-sans" style={{background:"rgba(255,255,255,0.04)",color:"#8A8480"}}>👥 {pick.buyerCount} buyers</span>
              </div>

              {/* Content — locked or revealed */}
              {purchased || isOwner ? (
                <div className="p-4 rounded-xl" style={{background:"rgba(42,107,69,0.08)",border:"1px solid rgba(42,107,69,0.2)"}}>
                  <p className="text-xs font-dm-sans font-bold mb-2" style={{color:"#2A6B45"}}>🔓 Your picks</p>
                  <pre className="text-sm font-dm-sans text-paper whitespace-pre-wrap leading-relaxed">{pick.picksContent}</pre>
                </div>
              ) : (
                <div className="p-4 rounded-xl text-center" style={{background:"rgba(255,255,255,0.03)",border:"1px dashed rgba(255,255,255,0.1)"}}>
                  <p className="text-2xl mb-2">🔒</p>
                  <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>Purchase to unlock the actual picks</p>
                </div>
              )}
            </div>

            {/* Action area */}
            {!isOwner && (
              <div className="p-5 rounded-2xl" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-syne font-bold text-3xl" style={{color:"#D4A84B"}}>{pick.currency} {pick.price}</p>
                  <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>⚡ Escrow — instant payout on confirmation</p>
                </div>

                {!purchased ? (
                  <button onClick={handleBuy} disabled={paying}
                    className="w-full py-4 rounded-xl font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{background:"#D4A84B",color:"#000"}}>
                    {paying ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Redirecting...</> : `Buy picks — ${pick.currency} ${pick.price} →`}
                  </button>
                ) : purchase?.escrowStatus === "held" ? (
                  <button onClick={handleConfirmDelivery} disabled={confirming}
                    className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{background:"#2A6B45"}}>
                    {confirming ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Confirming...</> : "✅ Confirm I received the picks"}
                  </button>
                ) : (
                  <div className="text-center py-3">
                    <p className="font-dm-sans font-semibold text-sm" style={{color:"#2A6B45"}}>✓ Picks received & payment confirmed</p>
                  </div>
                )}
              </div>
            )}

            {isOwner && (
              <div className="p-4 rounded-2xl text-center" style={{background:"rgba(212,168,75,0.06)",border:"1px solid rgba(212,168,75,0.15)"}}>
                <p className="font-dm-sans text-sm" style={{color:"#D4A84B"}}>Your VIP pick — {pick.buyerCount} buyer{pick.buyerCount!==1?"s":""}</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
