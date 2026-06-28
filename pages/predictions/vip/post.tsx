// pages/predictions/vip/post.tsx
// ─── POST A VIP PAID PICK ─────────────────────────────────────────
// Tipster sets price, writes teaser (public) + actual picks (hidden).
// Buyer pays via Stripe → escrow holds → tipster delivers →
// buyer confirms → instant payout to tipster (5% commission).

import Head           from "next/head";
import { useRouter }  from "next/router";
import { useState }   from "react";
import toast           from "react-hot-toast";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import { createVIPPick, getTipsterProfile, SPORTS, COMMISSION_RATE } from "@/services/predictionService";

export default function PostVIPPickPage() {
  const { user, userDoc, isLoggedIn } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sport:        SPORTS[0],
    title:        "",
    description:  "",   // teaser — shown publicly
    picksContent: "",   // actual picks — hidden until paid
    price:        "",
    currency:     "CAD",
    matchDate:    new Date().toISOString().split("T")[0],
  });

  function up(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  const price       = parseFloat(form.price) || 0;
  const commission  = Math.round(price * COMMISSION_RATE * 100) / 100;
  const payout      = price - commission;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn || !user || !userDoc) { router.push("/auth/login?redirect=/predictions/vip/post"); return; }
    if (!form.title || !form.price || !form.picksContent) {
      toast.error("Please fill in title, price, and the actual picks content");
      return;
    }

    setSaving(true);
    try {
      const tipster = await getTipsterProfile(user.uid);
      const id = await createVIPPick({
        tipsterId:    user.uid,
        tipsterName:  tipster?.name || userDoc.displayName || "Tipster",
        tipsterPhoto: tipster?.photo || userDoc.photoURL || "",
        verified:     tipster?.verified || false,
        title:        form.title,
        description:  form.description,
        sport:        form.sport,
        matchDate:    form.matchDate,
        price:        price,
        currency:     form.currency,
        picksContent: form.picksContent,
      });
      toast.success("VIP pick posted! 💰");
      router.push(`/predictions/vip/${id}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to post VIP pick");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none";
  const inpStyle = { background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"#F2EDE4" };

  return (
    <>
      <Head><title>Sell VIP Pick — Planet Mall Predictions</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#0A0908"}}>
          <div className="max-w-xl mx-auto pt-8">
            <h1 className="font-syne font-bold text-3xl text-paper mb-1">Sell a VIP pick</h1>
            <p className="text-sm font-dm-sans mb-8" style={{color:"#8A8480"}}>
              Set your price. Buyers pay securely — you get paid instantly when they confirm they received the games.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper">Pick details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <select className={inp} style={inpStyle} value={form.sport} onChange={e=>up("sport",e.target.value)}>
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input className={inp} style={inpStyle} type="date" value={form.matchDate} onChange={e=>up("matchDate",e.target.value)} />
                </div>
                <input className={inp} style={inpStyle} value={form.title} onChange={e=>up("title",e.target.value)}
                  placeholder="Title * (e.g. Weekend Fixed Games — 3 Matches)" />
                <textarea className={inp} style={inpStyle} rows={2} value={form.description} onChange={e=>up("description",e.target.value)}
                  placeholder="Teaser description (PUBLIC — don't reveal the actual games here)" />
              </div>

              <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper">🔒 Actual picks (hidden until purchased)</h2>
                <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>This content is only revealed to buyers who have paid. Include match, teams, tip, odds.</p>
                <textarea className={inp} style={inpStyle} rows={6} value={form.picksContent} onChange={e=>up("picksContent",e.target.value)}
                  placeholder="e.g.&#10;Match 1: Argentina vs Brazil — Argentina Win — Odds 1.85&#10;Match 2: Man City vs Chelsea — Over 2.5 Goals — Odds 1.65&#10;Match 3: Real Madrid vs Atletico — Both Teams to Score — Odds 1.70" />
              </div>

              <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper">Price</h2>
                <div className="grid grid-cols-3 gap-3">
                  <select className={inp} style={inpStyle} value={form.currency} onChange={e=>up("currency",e.target.value)}>
                    {["CAD","USD","GBP","GHS","NGN"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="col-span-2">
                    <input className={inp} style={inpStyle} type="number" step="0.01" value={form.price} onChange={e=>up("price",e.target.value)} placeholder="Your price *" />
                  </div>
                </div>
                {price > 0 && (
                  <div className="p-3 rounded-xl" style={{background:"rgba(42,107,69,0.08)",border:"1px solid rgba(42,107,69,0.15)"}}>
                    <div className="flex justify-between text-xs font-dm-sans mb-1">
                      <span style={{color:"#8A8480"}}>Buyer pays</span>
                      <span className="text-paper font-semibold">{form.currency} {price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-dm-sans mb-1">
                      <span style={{color:"#8A8480"}}>Planet Mall commission (5%)</span>
                      <span style={{color:"#C4531A"}}>- {form.currency} {commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-dm-sans font-bold pt-1" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                      <span style={{color:"#2A6B45"}}>Your payout</span>
                      <span style={{color:"#2A6B45"}}>{form.currency} {payout.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 rounded-xl font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#D4A84B",color:"#000"}}>
                {saving ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Posting...</> : "Post VIP pick →"}
              </button>
              <p className="text-xs text-center font-dm-sans" style={{color:"#8A8480"}}>
                Payment held in escrow — released instantly when buyer confirms they received the picks.
              </p>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
