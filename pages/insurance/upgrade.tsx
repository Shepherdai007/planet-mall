// pages/insurance/upgrade.tsx
// ─── BROKER PRO UPGRADE ──────────────────────────────────────────
// CA$19/month — unlimited leads, full contact details unlocked.
// Reuses the existing Stripe subscription checkout flow.

import Head           from "next/head";
import { useRouter }  from "next/router";
import { useState }   from "react";
import toast            from "react-hot-toast";
import Layout           from "@/components/Layout";
import { useAuth }      from "@/context/AuthContext";

export default function BrokerUpgradePage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!isLoggedIn || !user) { router.push("/auth/login?redirect=/insurance/upgrade"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: "broker_monthly", userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Upgrade to Pro — Planet Mall Insurance</title></Head>
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{background:"#0E0C0A"}}>
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <p className="text-4xl mb-3">⭐</p>
              <h1 className="font-syne font-bold text-3xl text-paper mb-2">Broker Pro</h1>
              <p className="text-sm font-dm-sans text-muted">Unlimited leads. Full contact details. Priority visibility.</p>
            </div>

            <div className="p-8 rounded-2xl mb-6" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(212,168,75,0.25)"}}>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-syne font-bold text-4xl text-paper">CA$19</span>
                <span className="text-sm text-muted font-dm-sans">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited insurance leads every month",
                  "Full buyer contact info — phone, email, details",
                  "Direct messaging with every buyer",
                  "⭐ Pro badge on your broker profile",
                  "Cancel anytime",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm font-dm-sans" style={{color:"rgba(242,237,228,0.8)"}}>
                    <span className="mt-0.5 flex-shrink-0" style={{color:"#D4A84B"}}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button onClick={handleUpgrade} disabled={loading}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"linear-gradient(135deg,#D4A84B,#C4531A)"}}>
                {loading
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Redirecting...</>
                  : "Upgrade to Pro →"}
              </button>
            </div>

            <p className="text-xs text-center font-dm-sans" style={{color:"#8A8480"}}>
              Free tier: 3 leads per month with limited info. Pro unlocks everything.
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}
