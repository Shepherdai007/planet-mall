// pages/seller/orders.tsx
// ─── SELLER ORDERS PAGE (PHASE 9) ───────────────────────────────

import Head              from "next/head";
import Link              from "next/link";
import { useEffect, useState } from "react";
import { useRouter }     from "next/router";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db }            from "@/lib/firebase";
import ProtectedRoute    from "@/components/ProtectedRoute";
import { useAuth }       from "@/context/AuthContext";
import { getShopByOwner } from "@/services/shopService";
import { formatCurrency, timeAgo } from "@/lib/helpers";
import toast from "react-hot-toast";

const STATUSES = ["pending","confirmed","shipped","delivered","cancelled"];

export default function SellerOrdersPage() {
  return (
    <ProtectedRoute requireRole="seller">
      <SellerOrders />
    </ProtectedRoute>
  );
}

function SellerOrders() {
  const { user } = useAuth();
  const router   = useRouter();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [shopId,  setShopId]  = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    if (!user) return;
    getShopByOwner(user.uid).then(s => {
      if (!s) { router.push("/seller/create-shop"); return; }
      setShopId(s.shopId!);
      const q = query(collection(db,"orders"), where("shopId","==",s.shopId));
      const unsub = onSnapshot(q, snap => {
        const data = snap.docs.map(d=>({id:d.id,...d.data()}));
        data.sort((a:any,b:any)=>((b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
        setOrders(data);
        setLoading(false);
      });
      return unsub;
    });
  }, [user, router]);

  async function updateStatus(orderId: string, status: string) {
    await updateDoc(doc(db,"orders",orderId), { status });
    toast.success(`Order marked as ${status}`);
  }

  const filtered = filter === "all" ? orders : orders.filter((o:any) => o.status === filter);

  const STATUS_COLORS: Record<string,{bg:string,text:string}> = {
    pending:   {bg:"#D4A84B15",text:"#D4A84B"},
    confirmed: {bg:"#2A6B4515",text:"#2A6B45"},
    shipped:   {bg:"rgba(100,100,255,0.1)",text:"#8888ff"},
    delivered: {bg:"#2A6B4520",text:"#2A6B45"},
    cancelled: {bg:"#C4531A15",text:"#C4531A"},
  };

  return (
    <>
      <Head><title>Orders — Planet Mall</title></Head>
      <div className="min-h-screen" style={{background:"#F6F1E9",color:"#1A1714"}}>
        <div style={{background:"#1A1714"}} className="px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-syne font-bold text-paper hidden sm:block">Planet Mall</span>
            </div>
            <nav className="hidden md:flex gap-5 text-sm font-dm-sans">
              {[
                {href:"/seller/dashboard",label:"Dashboard"},
                {href:"/seller/products", label:"Products"},
                {href:"/seller/orders",   label:"Orders"},
                {href:"/seller/analytics",label:"Analytics"},
                {href:"/seller/settings", label:"Settings"},
              ].map(({href,label})=>(
                <Link key={href} href={href} style={{color:router.pathname===href?"#C4531A":"#8A8480"}}>{label}</Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif"}} className="text-3xl font-bold">Orders</h1>
              <p className="text-sm font-dm-sans mt-1" style={{color:"#8A8480"}}>{orders.length} total</p>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {["all",...STATUSES].map(s=>(
                <button key={s} onClick={()=>setFilter(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-medium capitalize transition-all"
                  style={{
                    background: filter===s?"#C4531A":"#E8E2D9",
                    color:      filter===s?"#fff":"#8A8480",
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
              <p className="text-4xl mb-3">📦</p>
              <p className="font-dm-sans" style={{color:"#8A8480"}}>No {filter === "all" ? "" : filter} orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((order:any)=>{
                const colors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                return (
                  <div key={order.id} className="p-5 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs font-mono" style={{color:"#8A8480"}}>#{order.id.slice(0,10).toUpperCase()}</p>
                        <p className="font-dm-sans font-semibold mt-0.5" style={{color:"#1A1714"}}>{order.buyerEmail}</p>
                        <p className="text-xs font-dm-sans mt-0.5" style={{color:"#8A8480"}}>{timeAgo(order.createdAt as any)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize font-dm-sans"
                          style={{background:colors.bg,color:colors.text}}>
                          {order.status}
                        </span>
                        <p className="font-syne font-bold" style={{color:"#1A1714"}}>{formatCurrency(order.total||0,"CAD")}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {order.items?.map((item:any,i:number)=>(
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-dm-sans"
                          style={{background:"#F6F1E9",color:"#1A1714"}}>
                          {item.name} × {item.quantity}
                        </div>
                      ))}
                    </div>

                    {/* Shipping */}
                    {order.shippingAddress && (
                      <p className="text-xs font-dm-sans mb-4" style={{color:"#8A8480"}}>
                        📍 {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.country}
                      </p>
                    )}

                    {/* Status update */}
                    {order.status !== "delivered" && order.status !== "cancelled" && (
                      <div className="flex gap-2 flex-wrap">
                        {STATUSES
                          .filter(s => s !== order.status && s !== "pending")
                          .map(s=>(
                            <button key={s} onClick={()=>updateStatus(order.id,s)}
                              className="px-3 py-1.5 rounded-xl text-xs font-dm-sans font-medium border capitalize transition-all"
                              style={{borderColor:"#D4CFC6",color:"#8A8480",background:"transparent"}}
                              onMouseEnter={e=>{(e.target as HTMLElement).style.background="#F6F1E9"}}
                              onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent"}}>
                              Mark as {s}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
