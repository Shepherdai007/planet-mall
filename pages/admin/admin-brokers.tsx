// pages/admin/brokers.tsx
// ─── ADMIN: VERIFY INSURANCE BROKERS ─────────────────────────────
// Only accessible to userDoc.role === "admin".
// Lists pending broker applications with a one-tap verify button.

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db }           from "@/lib/firebase";
import toast             from "react-hot-toast";
import Layout            from "@/components/Layout";
import { useAuth }       from "@/context/AuthContext";
import type { InsuranceBroker } from "@/services/insuranceService";

export default function AdminBrokersPage() {
  const { userDoc, isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [brokers,  setBrokers]  = useState<InsuranceBroker[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter,   setFilter]   = useState<"pending"|"verified"|"all">("pending");

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn || userDoc?.role !== "admin") { router.push("/"); return; }
    load();
  }, [userDoc, isLoggedIn, loading]);

  async function load() {
    setFetching(true);
    const snap = await getDocs(collection(db, "insuranceBrokers"));
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as InsuranceBroker));
    results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setBrokers(results);
    setFetching(false);
  }

  async function handleVerify(id: string) {
    await updateDoc(doc(db, "insuranceBrokers", id), { verified: true });
    setBrokers(prev => prev.map(b => b.id === id ? { ...b, verified: true } : b));
    toast.success("Broker verified! ✅");
  }

  async function handleReject(id: string) {
    if (!confirm("Reject and remove this application?")) return;
    await deleteDoc(doc(db, "insuranceBrokers", id));
    setBrokers(prev => prev.filter(b => b.id !== id));
    toast.success("Application removed");
  }

  const filtered = brokers.filter(b => {
    if (filter === "pending") return !b.verified;
    if (filter === "verified") return b.verified;
    return true;
  });

  if (loading || (userDoc && userDoc.role !== "admin")) return null;

  return (
    <>
      <Head><title>Verify Brokers — Admin — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pt-8 pb-20 px-4" style={{background:"#0E0C0A"}}>
          <div className="max-w-3xl mx-auto">
            <h1 className="font-syne font-bold text-3xl text-paper mb-1">Insurance brokers</h1>
            <p className="text-sm font-dm-sans text-muted mb-8">Review and verify broker applications</p>

            <div className="flex gap-2 mb-6">
              {(["pending","verified","all"] as const).map(f => (
                <button key={f} onClick={()=>setFilter(f)}
                  className="px-4 py-1.5 rounded-full text-xs font-dm-sans font-medium capitalize transition-all"
                  style={{
                    background: filter===f ? "#C4531A" : "rgba(255,255,255,0.04)",
                    color:      filter===f ? "#fff" : "#8A8480",
                    border:     `1px solid ${filter===f ? "#C4531A" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  {f} {f==="pending" && `(${brokers.filter(b=>!b.verified).length})`}
                </button>
              ))}
            </div>

            {fetching ? (
              <div className="flex justify-center py-20">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-20 font-dm-sans text-muted">No {filter !== "all" ? filter : ""} applications</p>
            ) : (
              <div className="space-y-3">
                {filtered.map(b => (
                  <div key={b.id} className="p-5 rounded-2xl" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-dm-sans font-semibold text-paper">{b.brokerName}</p>
                        <p className="text-xs text-muted font-dm-sans">{b.companyName} · License: {b.licenseNumber}</p>
                        <p className="text-xs text-muted font-dm-sans mt-1">📍 {b.city}, {b.province} · 📞 {b.phone}</p>
                      </div>
                      {b.verified ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-dm-sans" style={{background:"rgba(42,107,69,0.15)",color:"#2A6B45"}}>
                          ✓ VERIFIED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-dm-sans" style={{background:"rgba(212,168,75,0.15)",color:"#D4A84B"}}>
                          PENDING
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {b.specialties?.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-dm-sans" style={{background:"rgba(196,83,26,0.1)",color:"#C4531A"}}>{s}</span>
                      ))}
                    </div>

                    {b.bio && <p className="text-xs font-dm-sans text-paper/60 mb-3">{b.bio}</p>}

                    {!b.verified && (
                      <div className="flex gap-2">
                        <button onClick={()=>handleVerify(b.id!)}
                          className="px-4 py-2 rounded-xl text-xs font-dm-sans font-bold text-white" style={{background:"#2A6B45"}}>
                          ✓ Verify
                        </button>
                        <button onClick={()=>handleReject(b.id!)}
                          className="px-4 py-2 rounded-xl text-xs font-dm-sans font-semibold border" style={{borderColor:"rgba(255,255,255,0.1)",color:"#8A8480"}}>
                          Reject
                        </button>
                      </div>
                    )}
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
