// pages/pricing.tsx
// ─── PRICING PAGE (PHASE 7) ──────────────────────────────────────
// Shows all plans with Stripe checkout integration.
// Design: dark void, gold premium accent.

import Head          from "next/head";
import { useRouter } from "next/router";
import { useState }  from "react";
import toast         from "react-hot-toast";
import Layout        from "@/components/Layout";
import { useAuth }   from "@/context/AuthContext";

const PLANS = [
  {
    id:       "free",
    name:     "Free",
    price:    "CA$0",
    period:   null,
    subtitle: "Forever — no credit card",
    color:    "#8A8480",
    features: [
      "Open a store",
      "Up to 10 products",
      "Real-time buyer-seller messaging",
      "Standard checkout via Stripe",
      "1 active livestream",
      "Basic dashboard analytics",
      "Planet Mall branding on store",
    ],
    cta:      "Get started free",
    planKey:  null,
  },
  {
    id:       "premium_monthly",
    name:     "Premium",
    price:    "CA$14.99",
    period:   "month",
    subtitle: "or CA$129/year — save 25%",
    color:    "#C4531A",
    featured: true,
    features: [
      "Everything in Free",
      "✦ AI Store Builder",
      "✦ AI product descriptions",
      "✦ AI weekly business insights",
      "✦ AI customer support bot",
      "Unlimited products",
      "Custom domain",
      "Remove Planet Mall branding",
      "Multiple staff accounts",
      "Featured placement in search",
      "Priority support",
    ],
    cta:      "Start Premium",
    planKey:  "premium_monthly",
    yearlyId: "premium_yearly",
  },
  {
    id:       "business_monthly",
    name:     "Business",
    price:    "CA$39.99",
    period:   "month",
    subtitle: "For serious scale",
    color:    "#D4A84B",
    features: [
      "Everything in Premium",
      "Bulk CSV product import",
      "Public API access",
      "Dedicated account manager",
      "Custom AI brand voice",
      "Multi-warehouse inventory",
      "Team roles & permissions",
      "Advanced analytics",
      "White-label option",
    ],
    cta:      "Go Business",
    planKey:  "business_monthly",
  },
];

export default function PricingPage() {
  const { user, userDoc, subscription, isPremium, isBusiness } = useAuth();
  const router  = useRouter();
  const [yearly,   setYearly]   = useState(false);
  const [loading,  setLoading]  = useState<string | null>(null);

  async function handleUpgrade(planKey: string | null) {
    if (!planKey) { router.push("/auth/signup"); return; }
    if (!user) { router.push("/auth/login?redirect=/pricing"); return; }

    setLoading(planKey);
    try {
      const actualPlan = yearly && planKey === "premium_monthly" ? "premium_yearly" : planKey;
      const res  = await fetch("/api/stripe/create-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: actualPlan, userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  }

  function getCurrentPlan() {
    if (isBusiness) return "business_monthly";
    if (isPremium)  return "premium_monthly";
    return "free";
  }

  const currentPlan = getCurrentPlan();

  return (
    <>
      <Head><title>Pricing — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen bg-cream pt-20 pb-24 px-4">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="text-center mb-16">
              <p className="text-rust text-xs font-dm-sans uppercase tracking-[0.2em] mb-4">Simple pricing</p>
              <h1 className="font-syne font-bold text-4xl sm:text-5xl text-paper mb-4">
                Start free. Scale when ready.
              </h1>
              <p className="text-muted font-dm-sans mb-8">No hidden fees. Cancel anytime. All prices in CAD.</p>

              {/* Monthly / Yearly toggle */}
              <div className="inline-flex items-center gap-3 p-1 rounded-full"
                style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <button onClick={() => setYearly(false)}
                  className="px-4 py-2 rounded-full text-sm font-dm-sans font-medium transition-all"
                  style={{background:!yearly?"#C4531A":"transparent",color:!yearly?"#fff":"#8A8480"}}>
                  Monthly
                </button>
                <button onClick={() => setYearly(true)}
                  className="px-4 py-2 rounded-full text-sm font-dm-sans font-medium transition-all flex items-center gap-2"
                  style={{background:yearly?"#C4531A":"transparent",color:yearly?"#fff":"#8A8480"}}>
                  Yearly
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{background:"rgba(42,107,69,0.3)",color:"#2A6B45"}}>
                    SAVE 25%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map(plan => {
                const isCurrentPlan = currentPlan === plan.id;
                const displayPrice = yearly && plan.id === "premium_monthly"
                  ? { price: "CA$89", period: "year" }
                  : { price: plan.price, period: plan.period };

                return (
                  <div key={plan.id}
                    className="relative p-8 rounded-2xl border transition-all"
                    style={{
                      background:  (plan as any).featured ? "rgba(196,83,26,0.05)" : "rgba(255,255,255,0.02)",
                      borderColor: (plan as any).featured ? "rgba(196,83,26,0.3)"  : "rgba(255,255,255,0.06)",
                      boxShadow:   (plan as any).featured ? "0 0 40px rgba(196,83,26,0.1)" : "none",
                    }}>

                    {(plan as any).featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-rust text-white text-xs font-bold rounded-full font-dm-sans">
                        Most Popular
                      </span>
                    )}

                    {isCurrentPlan && (
                      <span className="absolute -top-3 right-6 px-3 py-1 text-white text-xs font-bold rounded-full font-dm-sans"
                        style={{background:"#2A6B45"}}>
                        Current plan
                      </span>
                    )}

                    <p className="font-syne font-bold text-xl text-paper mb-1">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-syne font-bold text-3xl text-paper">{displayPrice.price}</span>
                      {displayPrice.period && (
                        <span className="text-sm text-muted font-dm-sans">/{displayPrice.period}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted font-dm-sans mb-6">{plan.subtitle}</p>

                    <ul className="space-y-2.5 mb-8">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm font-dm-sans"
                          style={{color: f.startsWith("✦") ? "#D4A84B" : "rgba(242,237,228,0.7)"}}>
                          {f.startsWith("✦")
                            ? <span className="mt-0.5 flex-shrink-0" style={{color:"#D4A84B"}}>✦</span>
                            : <span className="mt-0.5 flex-shrink-0" style={{color:"#2A6B45"}}>✓</span>}
                          {f.replace("✦ ", "")}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => !plan.planKey ? router.push("/auth/signup") : handleUpgrade(plan.planKey)}
                      disabled={isCurrentPlan || (plan.planKey !== null && !!loading)}
                      className="w-full py-3.5 rounded-xl text-sm font-dm-sans font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{
                        background: isCurrentPlan
                          ? "rgba(42,107,69,0.15)"
                          : (plan as any).featured
                            ? "#C4531A"
                            : "rgba(255,255,255,0.06)",
                        color: isCurrentPlan ? "#2A6B45" : "#F2EDE4",
                        border: !(plan as any).featured && !isCurrentPlan ? "1px solid rgba(255,255,255,0.1)" : "none",
                      }}>
                      {loading === plan.planKey ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Redirecting...</>
                      ) : isCurrentPlan ? "✓ Current plan" : plan.cta}                    </button>
                  </div>
                );
              })}
            </div>

            {/* FAQ */}
            <div className="mt-20 max-w-2xl mx-auto">
              <h2 className="font-syne font-bold text-2xl text-paper text-center mb-8">Common questions</h2>
              <div className="space-y-4">
                {[
                  { q: "Can I cancel anytime?", a: "Yes. Cancel anytime and you keep your Premium access until the end of your billing period. No penalties." },
                  { q: "What payment methods are accepted?", a: "All major credit and debit cards via Stripe — Visa, Mastercard, Amex, and more. Prices are in Canadian dollars (CAD)." },
                  { q: "Can I upgrade from Premium to Business?", a: "Yes — you'll be charged the difference prorated for the remaining billing period." },
                  { q: "Is there a free trial?", a: "The Free plan is free forever. You can explore the platform fully before upgrading." },
                  { q: "Do I need a credit card for the free plan?", a: "No credit card required for Free. Only needed when you upgrade." },
                ].map(({ q, a }) => (
                  <div key={q} className="p-5 rounded-2xl" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <p className="font-dm-sans font-semibold text-paper text-sm mb-2">{q}</p>
                    <p className="font-dm-sans text-muted text-sm leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
