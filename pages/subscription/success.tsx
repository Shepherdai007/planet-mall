// pages/subscription/success.tsx
// ─── SUBSCRIPTION SUCCESS PAGE ───────────────────────────────────

import Head          from "next/head";
import Link          from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, updateDoc }      from "firebase/firestore";
import { db }                  from "@/lib/firebase";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { plan, uid } = router.query;
    if (!plan || !uid) return;

    async function activate() {
      try {
        await updateDoc(doc(db, "subscriptions", uid as string), {
          plan:   (plan as string).includes("yearly") ? "premium" : plan,
          status: "active",
        });
      } catch(e) { console.error(e); }
      setDone(true);
    }
    activate();
  }, [router.query]);

  const plan       = (router.query.plan as string) || "";
  const isPremium  = plan.includes("premium");

  return (
    <>
      <Head><title>Welcome to {isPremium ? "Premium" : "Business"} — Planet Mall</title></Head>
      <div className="min-h-screen bg-void flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">

          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
            style={{background: isPremium ? "rgba(196,83,26,0.15)" : "rgba(212,168,75,0.15)"}}>
            {isPremium ? "🔥" : "🚀"}
          </div>

          <h1 className="font-syne font-bold text-3xl text-paper mb-3">
            You're on {isPremium ? "Premium" : "Business"}!
          </h1>
          <p className="text-muted font-dm-sans mb-8 leading-relaxed">
            {isPremium
              ? "AI Store Builder, unlimited products, and all premium features are now unlocked."
              : "Full access to everything Planet Mall has to offer. Your business is ready to scale."}
          </p>

          <div className="space-y-2.5 mb-10 text-left">
            {(isPremium ? [
              { icon:"✦", text:"AI Store Builder — describe your business, Claude builds it", gold:true },
              { icon:"✦", text:"AI product descriptions — write once, sell forever",           gold:true },
              { icon:"✦", text:"Weekly AI business insights — plain-English reports",          gold:true },
              { icon:"✓", text:"Unlimited products",                                           gold:false },
              { icon:"✓", text:"Custom domain",                                                gold:false },
              { icon:"✓", text:"Remove Planet Mall branding",                                  gold:false },
            ] : [
              { icon:"✦", text:"Everything in Premium",          gold:true },
              { icon:"✓", text:"Bulk CSV product import",        gold:false },
              { icon:"✓", text:"API access",                     gold:false },
              { icon:"✓", text:"Dedicated account manager",      gold:false },
              { icon:"✓", text:"Team roles & permissions",       gold:false },
            ]).map(f => (
              <div key={f.text} className="flex items-start gap-3 text-sm font-dm-sans"
                style={{color: f.gold ? "#D4A84B" : "rgba(242,237,228,0.7)"}}>
                <span className="flex-shrink-0 mt-0.5">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/ai/shop-builder"
              className="block py-3.5 rounded-xl text-white font-dm-sans font-semibold"
              style={{background:"linear-gradient(135deg, #C4531A, #D4A84B)"}}>
              ✦ Try AI Store Builder →
            </Link>
            <Link href="/seller/dashboard"
              className="block py-3.5 rounded-xl font-dm-sans font-medium text-sm border border-white/10 text-muted hover:text-paper transition-colors">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
