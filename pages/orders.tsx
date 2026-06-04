// pages/orders.tsx
// ─── BUYER ORDERS PAGE WITH ESCROW (PHASE 9+) ───────────────────
// Shows all buyer orders with escrow status.
// Buyer can: confirm delivery, open dispute, track order.

import Head           from "next/head";
import Link           from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db }         from "@/lib/firebase";
import Layout         from "@/components/Layout";
import { useAuth }    from "@/context/AuthContext";
import { formatCurrency, timeAgo } from "@/lib/helpers";
import toast          from "react-hot-toast";

const STATUS_COLORS: Record<string,{bg:string,text:string}> = {
  pending:   {bg:"#D4A84B15",text:"#D4A84B"},
  confirmed: {bg:"#2A6B4515",text:"#2A6B45"},
  shipped:   {bg:"rgba(100,149,237,0.1)",text:"#6495ED"},
  delivered: {bg:"#2A6B4520",text:"#2A6B45"},
  cancelled: {bg:"#C4531A15",text:"#C4531A"},
};

const ESCROW_STATUS: Record<string,{label:string,color:string,desc:string}> = {
  held:     {label:"Payment held",    color:"#D4A84B", desc:"Your payment is safely held by Planet Mall until you confirm delivery."},
  released: {label:"Payment released",color:"#2A6B45", desc:"Payment has been released to the seller."},
  disputed: {label:"Under dispute",   color:"#C4531A", desc:"This order is under review by Planet Mall. Your payment is frozen."},
  refunded: {label:"Refunded",        color:"#2A6B45", desc:"Your payment has been refunded."},
};

export default function OrdersPage() {
  const { user, isLoggedIn, loading } = useAuth();
  const [orders,     setOrders]     = useState<any[]>([]);
  const [fetching,   setFetching]   = useState(true);
  const [confirming, setConfirming] = useState<string|null>(null);
  const [disputing,  setDisputing]  = useState<string|null>(null);
  const [disputeForm, setDisputeForm] = useState({reason:"", description:""});

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db,"orders"), where("buyerId","==",user.uid))).then(snap => {
      const data = snap.docs.map(d=>({id:d.id,...d.data()}));
      data.sort((a:any,b:any)=>((b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
      setOrders(data);
      setFetching(false);
    });
  }, [user]);

  async function handleConfirmDelivery(orderId: string) {
    if (!user) return;
    setConfirming(orderId);
    try {
      const res = await fetch("/api/escrow/confirm-delivery", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ orderId, buyerId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(prev => prev.map(o => o.id === orderId
        ? {...o, status:"delivered", escrowStatus:"released"}
        : o
      ));
      toast.success("Delivery confirmed! Payment released to seller. 🎉");
    } catch(err:any) {
      toast.error(err.message || "Failed to confirm delivery");
    } finally {
      setConfirming(null);
    }
  }

  async function handleOpenDispute(orderId: string) {
    if (!user || !disputeForm.reason) {
      toast.error("Please select a reason");
      return;
    }
    try {
      const res = await fetch("/api/escrow/open-dispute", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ orderId, buyerId: user.uid, ...disputeForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(prev => prev.map(o => o.id === orderId
        ? {...o, escrowStatus:"disputed"}
        : o
      ));
      setDisputing(null);
      setDisputeForm({reason:"", description:""});
      toast.success("Dispute opened. We'll review within 24 hours.");
    } catch(err:any) {
      toast.error(err.message || "Failed to open dispute");
    }
  }

  return (
    <>
      <Head><title>My Orders — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen bg-void pt-10 pb-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-syne font-bold text-3xl text-paper mb-2">My orders</h1>
            <p className="text-sm text-muted font-dm-sans mb-8">
              Your payment is held securely by Planet Mall until you confirm delivery.
            </p>

            {/* Escrow explanation banner */}
            <div className="p-4 rounded-2xl mb-8 flex gap-3"
              style={{background:"rgba(212,168,75,0.08)",border:"1px solid rgba(212,168,75,0.2)"}}>
              <span className="text-xl flex-shrink-0">🔐</span>
              <div>
                <p className="font-dm-sans font-semibold text-sm text-paper mb-1">How Planet Mall protects your payment</p>
                <p className="text-xs text-muted font-dm-sans leading-relaxed">
                  When you pay, your money is held securely by Planet Mall — not released to the seller until you confirm you received your item.
                  If there's a problem, open a dispute and we'll investigate within 24 hours. Payment auto-releases after 14 days if no issue is reported.
                </p>
              </div>
            </div>

            {fetching ? (
              <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-4xl mb-4">📦</p>
                <h2 className="font-syne font-bold text-xl text-paper mb-2">No orders yet</h2>
                <Link href="/explore" className="px-6 py-3 rounded-full text-white text-sm font-dm-sans font-semibold inline-block mt-4" style={{background:"#C4531A"}}>
                  Browse marketplace
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order:any) => {
                  const statusColors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                  const escrow       = ESCROW_STATUS[order.escrowStatus || "held"];
                  const canConfirm   = ["shipped","confirmed"].includes(order.status) && order.escrowStatus !== "released" && order.escrowStatus !== "disputed";
                  const canDispute   = ["pending","confirmed","shipped"].includes(order.status) && order.escrowStatus !== "disputed" && order.escrowStatus !== "released";

                  return (
                    <div key={order.id} className="rounded-2xl overflow-hidden" style={{border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)"}}>

                      {/* Order header */}
                      <div className="px-5 py-4 flex items-start justify-between" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                        <div>
                          <p className="text-xs font-mono text-muted">#{order.id.slice(0,10).toUpperCase()}</p>
                          <p className="font-dm-sans font-semibold text-sm text-paper mt-0.5">{order.shopName}</p>
                          <p className="text-xs text-muted font-dm-sans mt-0.5">{timeAgo(order.createdAt as any)}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize font-dm-sans"
                            style={{background:statusColors.bg,color:statusColors.text}}>
                            {order.status}
                          </span>
                          <p className="font-syne font-bold text-paper mt-1">{formatCurrency(order.total||0,"CAD")}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                        <div className="flex gap-2 flex-wrap">
                          {order.items?.map((item:any,i:number)=>(
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{background:"rgba(255,255,255,0.06)"}}>
                                {item.image
                                  ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                              </div>
                              <div>
                                <p className="text-xs font-dm-sans text-paper">{item.name}</p>
                                <p className="text-[10px] text-muted font-dm-sans">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Escrow status */}
                      <div className="px-5 py-3 flex items-center gap-2" style={{borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.01)"}}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:escrow?.color||"#D4A84B"}} />
                        <p className="text-xs font-dm-sans font-semibold" style={{color:escrow?.color||"#D4A84B"}}>
                          {escrow?.label || "Payment held"}
                        </p>
                        <p className="text-xs text-muted font-dm-sans">— {escrow?.desc || "Your payment is safely held by Planet Mall."}</p>
                      </div>

                      {/* Actions */}
                      {(canConfirm || canDispute) && (
                        <div className="px-5 py-4 flex flex-wrap gap-3">
                          {canConfirm && (
                            <button
                              onClick={() => handleConfirmDelivery(order.id)}
                              disabled={confirming === order.id}
                              className="px-5 py-2.5 rounded-xl text-white text-sm font-dm-sans font-semibold disabled:opacity-50 flex items-center gap-2"
                              style={{background:"#2A6B45"}}>
                              {confirming === order.id
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Confirming...</>
                                : "✓ I received my item"}
                            </button>
                          )}
                          {canDispute && (
                            <button
                              onClick={() => setDisputing(order.id)}
                              className="px-5 py-2.5 rounded-xl text-sm font-dm-sans font-medium border border-white/10 text-muted hover:text-paper transition-colors">
                              ⚠️ Open dispute
                            </button>
                          )}
                        </div>
                      )}

                      {/* Auto-release notice */}
                      {canConfirm && (
                        <div className="px-5 pb-4">
                          <p className="text-[10px] text-muted font-dm-sans">
                            Payment will auto-release to seller in 14 days if no dispute is opened.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dispute modal */}
        {disputing && (
          <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={()=>setDisputing(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{background:"#141210",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <h3 className="font-syne font-bold text-lg text-paper">Open a dispute</h3>
                  <button onClick={()=>setDisputing(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-muted" style={{background:"rgba(255,255,255,0.06)"}}>✕</button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="p-3 rounded-xl text-xs font-dm-sans leading-relaxed" style={{background:"rgba(212,168,75,0.08)",border:"1px solid rgba(212,168,75,0.2)",color:"#D4A84B"}}>
                    ⚠️ Opening a dispute will freeze the seller's payment until Planet Mall resolves the issue. We'll review within 24 hours.
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-2 text-paper">What's the problem? *</label>
                    <select value={disputeForm.reason} onChange={e=>setDisputeForm(f=>({...f,reason:e.target.value}))}
                      className="w-full px-4 py-3 rounded-xl text-sm font-dm-sans text-paper focus:outline-none"
                      style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
                      <option value="">Select reason</option>
                      <option value="not_received">Item not received</option>
                      <option value="not_as_described">Item not as described</option>
                      <option value="damaged">Item arrived damaged</option>
                      <option value="wrong_item">Wrong item sent</option>
                      <option value="seller_unresponsive">Seller not responding</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-2 text-paper">Describe the issue</label>
                    <textarea value={disputeForm.description} onChange={e=>setDisputeForm(f=>({...f,description:e.target.value}))}
                      rows={4} placeholder="Tell us exactly what happened..."
                      className="w-full px-4 py-3 rounded-xl text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none resize-none"
                      style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)"}} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={()=>handleOpenDispute(disputing)}
                      disabled={!disputeForm.reason}
                      className="flex-1 py-3 rounded-xl text-white font-dm-sans font-semibold text-sm disabled:opacity-50"
                      style={{background:"#C4531A"}}>
                      Submit dispute
                    </button>
                    <button onClick={()=>setDisputing(null)}
                      className="px-4 py-3 rounded-xl font-dm-sans text-sm border border-white/10 text-muted">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Layout>
    </>
  );
}
