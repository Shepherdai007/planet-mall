// pages/insurance/broker-dashboard.tsx
// ─── BROKER DASHBOARD ────────────────────────────────────────────
// Verified brokers see incoming insurance requests matching their
// specialties and can contact buyers directly or via Planet Mall
// messaging.

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useState, useEffect } from "react";
import toast            from "react-hot-toast";
import Layout           from "@/components/Layout";
import { useAuth }      from "@/context/AuthContext";
import {
  getInsuranceRequests, markRequestContacted, getBrokerProfile, INSURANCE_TYPES,
} from "@/services/insuranceService";
import { getOrCreateConversation } from "@/services/messageService";
import { timeAgo }      from "@/lib/helpers";
import type { InsuranceRequest, InsuranceBroker } from "@/services/insuranceService";

const TYPE_ICONS: Record<string,string> = {
  Auto: "🚗", Home: "🏠", Life: "❤️", Business: "💼", Travel: "✈️", Health: "🩺", Other: "📋",
};

export default function BrokerDashboardPage() {
  const { user, userDoc, isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [broker,   setBroker]   = useState<InsuranceBroker | null>(null);
  const [requests, setRequests] = useState<InsuranceRequest[]>([]);
  const [checking, setChecking] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [filter,   setFilter]   = useState("All");
  const [messaging, setMessaging] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) { router.push("/auth/login?redirect=/insurance/broker-dashboard"); return; }
    if (!user) return;
    getBrokerProfile(user.uid).then(b => {
      setBroker(b);
      setChecking(false);
      if (b?.verified) loadRequests();
    });
  }, [user, isLoggedIn, loading]);

  async function loadRequests() {
    setFetching(true);
    const data = await getInsuranceRequests({ status: undefined });
    setRequests(data);
    setFetching(false);
  }

  const filtered = filter === "All" ? requests : requests.filter(r => r.insuranceType === filter);

  async function handleMarkContacted(reqId: string) {
    if (!user) return;
    await markRequestContacted(reqId, user.uid);
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "contacted" } : r));
    toast.success("Marked as contacted");
  }

  async function handleMessage(req: InsuranceRequest) {
    if (!user || !broker) return;
    setMessaging(req.id!);
    try {
      const convId = await getOrCreateConversation(
        req.buyerId, req.buyerName, req.buyerPhoto || "",
        user.uid, broker.brokerName, broker.photo || "",
        user.uid, broker.brokerName, broker.photo || "",
        req.id!, `${req.insuranceType} Insurance Quote`
      );
      router.push(`/messages/${convId}`);
    } catch { toast.error("Failed to open chat"); }
    finally { setMessaging(null); }
  }

  if (checking || loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#0E0C0A"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    </Layout>
  );

  if (!broker) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 text-center" style={{background:"#0E0C0A"}}>
        <div>
          <p className="text-4xl mb-4">📋</p>
          <h1 className="font-syne font-bold text-2xl text-paper mb-2">Not a registered broker</h1>
          <p className="text-muted font-dm-sans mb-6">Apply to become a verified insurance broker to access this dashboard.</p>
          <Link href="/insurance/become-broker" className="px-6 py-3 rounded-full text-white font-dm-sans font-semibold inline-block" style={{background:"#C4531A"}}>
            Apply now →
          </Link>
        </div>
      </div>
    </Layout>
  );

  if (!broker.verified) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 text-center" style={{background:"#0E0C0A"}}>
        <div>
          <p className="text-4xl mb-4">⏳</p>
          <h1 className="font-syne font-bold text-2xl text-paper mb-2">Application pending</h1>
          <p className="text-muted font-dm-sans">We're reviewing your application. This usually takes 1-2 business days.</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <>
      <Head><title>Broker Dashboard — Planet Mall Insurance</title></Head>
      <Layout>
        <div className="min-h-screen pt-8 pb-20 px-4" style={{background:"#0E0C0A"}}>
          <div className="max-w-4xl mx-auto">

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-syne font-bold text-3xl text-paper">Broker dashboard</h1>
                <p className="text-sm font-dm-sans text-muted mt-1">
                  Welcome back, {broker.brokerName} · {broker.specialties.join(", ")}
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-bold" style={{background:"rgba(42,107,69,0.15)",color:"#2A6B45"}}>
                ✓ Verified
              </span>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {["All", ...broker.specialties].map(t => (
                <button key={t} onClick={()=>setFilter(t)}
                  className="px-4 py-1.5 rounded-full text-xs font-dm-sans font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    background: filter===t ? "#C4531A" : "rgba(255,255,255,0.04)",
                    color:      filter===t ? "#fff" : "#8A8480",
                    border:     `1px solid ${filter===t ? "#C4531A" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  {t}
                </button>
              ))}
            </div>

            {fetching ? (
              <div className="flex justify-center py-20">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-4xl mb-4">📭</p>
                <p className="font-dm-sans text-muted">No requests yet for this category</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(req => (
                  <div key={req.id} className="p-5 rounded-2xl"
                    style={{
                      background: req.status === "open" ? "rgba(196,83,26,0.04)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${req.status === "open" ? "rgba(196,83,26,0.2)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{TYPE_ICONS[req.insuranceType]}</span>
                        <div>
                          <p className="font-dm-sans font-semibold text-paper">{req.fullName}</p>
                          <p className="text-xs text-muted font-dm-sans">
                            {req.insuranceType} Insurance · 📍 {req.city}, {req.province} · {timeAgo(req.createdAt as any)}
                          </p>
                        </div>
                      </div>
                      {req.status === "open" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-dm-sans" style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
                          NEW
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-dm-sans" style={{background:"rgba(42,107,69,0.15)",color:"#2A6B45"}}>
                          CONTACTED
                        </span>
                      )}
                    </div>

                    {req.details && (
                      <p className="text-sm font-dm-sans text-paper/70 mb-3 pl-11">{req.details}</p>
                    )}

                    <div className="flex items-center gap-4 pl-11 mb-3 text-xs font-dm-sans text-muted">
                      <span>📞 {req.phone}</span>
                      {req.email && <span>✉️ {req.email}</span>}
                    </div>

                    <div className="flex gap-2 pl-11">
                      <a href={`tel:${req.phone}`}
                        className="px-4 py-2 rounded-xl text-xs font-dm-sans font-semibold text-white" style={{background:"#2A6B45"}}>
                        📞 Call
                      </a>
                      <button onClick={()=>handleMessage(req)} disabled={messaging===req.id}
                        className="px-4 py-2 rounded-xl text-xs font-dm-sans font-semibold text-white disabled:opacity-50" style={{background:"#C4531A"}}>
                        {messaging===req.id ? "Opening..." : "💬 Message"}
                      </button>
                      {req.status === "open" && (
                        <button onClick={()=>handleMarkContacted(req.id!)}
                          className="px-4 py-2 rounded-xl text-xs font-dm-sans font-semibold border" style={{borderColor:"rgba(255,255,255,0.1)",color:"#8A8480"}}>
                          Mark as contacted
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
