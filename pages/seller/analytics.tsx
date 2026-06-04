// pages/seller/analytics.tsx
// ─── SELLER ANALYTICS PAGE (PHASE 9) ────────────────────────────
// Revenue charts, top products, orders breakdown, AI insights.
// Design: cream bg, editorial, Playfair + DM Sans.

import Head              from "next/head";
import Link              from "next/link";
import { useEffect, useState } from "react";
import { useRouter }     from "next/router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db }            from "@/lib/firebase";
import ProtectedRoute    from "@/components/ProtectedRoute";
import { useAuth }       from "@/context/AuthContext";
import { getShopByOwner } from "@/services/shopService";
import { getProductsByShop } from "@/services/productService";
import { formatCurrency } from "@/lib/helpers";
import type { ShopData }   from "@/services/shopService";
import type { ProductData } from "@/services/productService";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requireRole="seller">
      <Analytics />
    </ProtectedRoute>
  );
}

function Analytics() {
  const { user, isPremium } = useAuth();
  const router = useRouter();
  const [shop,     setShop]     = useState<ShopData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [orders,   setOrders]   = useState<any[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const s = await getShopByOwner(user!.uid);
      if (!s) { router.push("/seller/create-shop"); return; }
      setShop(s);
      const p = await getProductsByShop(s.shopId!);
      setProducts(p);
      const q = query(collection(db, "orders"), where("shopId", "==", s.shopId));
      const snap = await getDocs(q);
      const o = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(o);
      setLoading(false);
    }
    load();
  }, [user, router]);

  async function fetchInsights() {
    if (!shop || !isPremium) return;
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shop.name,
          stats: {
            revenue:      totalRevenue,
            orders:       orders.length,
            newProducts:  0,
            totalProducts: products.length,
            liveProducts: products.filter(p => p.status === "live").length,
            topProduct:   topProducts[0]?.name || "None",
            followers:    shop.followers || 0,
            streams:      0,
          },
        }),
      });
      const data = await res.json();
      setInsights(data.insights || "");
    } catch { setInsights("Could not load insights right now."); }
    finally { setLoadingInsights(false); }
  }

  const totalRevenue  = orders.filter((o: any) => o.status !== "cancelled").reduce((s, o: any) => s + (o.total || 0), 0);
  const totalOrders   = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const topProducts   = [...products].sort((a, b) => (b.orders || 0) - (a.orders || 0)).slice(0, 5);

  // Last 7 days revenue mock (replace with real data)
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const weekRevenue = [0,0,0,0,0,0,totalRevenue];
  const maxRev = Math.max(...weekRevenue, 1);

  return (
    <>
      <Head>
        <title>Analytics — {shop?.name || "Planet Mall"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{background:"#F6F1E9",color:"#1A1714"}}>

        {/* Topbar */}
        <div style={{background:"#1A1714"}} className="px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-syne font-bold text-paper text-lg hidden sm:block">Planet Mall</span>
            </div>
            <nav className="hidden md:flex gap-5 text-sm font-dm-sans">
              {[
                {href:"/seller/dashboard",  label:"Dashboard"},
                {href:"/seller/products",   label:"Products"},
                {href:"/seller/orders",     label:"Orders"},
                {href:"/seller/analytics",  label:"Analytics"},
                {href:"/seller/settings",   label:"Settings"},
              ].map(({href,label})=>(
                <Link key={href} href={href}
                  style={{color:router.pathname===href?"#C4531A":"#8A8480"}}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/seller/products?new=1"
            className="px-4 py-2 rounded-full text-sm font-dm-sans font-semibold text-white"
            style={{background:"#C4531A"}}>
            + Add product
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 style={{fontFamily:"'Playfair Display',serif"}} className="text-3xl font-bold">Analytics</h1>
            <p className="text-sm font-dm-sans mt-1" style={{color:"#8A8480"}}>{shop?.name}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {label:"Total revenue",    value:formatCurrency(totalRevenue),       sub:"All time",            color:"#C4531A"},
              {label:"Total orders",     value:totalOrders.toString(),             sub:"All time",            color:"#2A6B45"},
              {label:"Avg order value",  value:formatCurrency(avgOrderValue),      sub:"Per order",           color:"#D4A84B"},
              {label:"Live products",    value:products.filter(p=>p.status==="live").length.toString(), sub:`of ${products.length} total`, color:"#8A8480"},
            ].map(({label,value,sub,color})=>(
              <div key={label} className="p-5 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <div className="w-2 h-2 rounded-full mb-4" style={{background:color}} />
                <p className="text-2xl font-bold font-syne" style={{color:"#1A1714"}}>{value}</p>
                <p className="text-xs font-semibold font-syne mt-0.5" style={{color:"#1A1714"}}>{label}</p>
                <p className="text-xs font-dm-sans mt-0.5" style={{color:"#8A8480"}}>{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif"}} className="text-lg font-bold mb-6">Revenue — last 7 days</h2>
              <div className="flex items-end gap-3 h-40">
                {weekRevenue.map((v,i)=>(
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>
                      {v > 0 ? formatCurrency(v) : ""}
                    </p>
                    <div className="w-full rounded-t-lg transition-all"
                      style={{
                        height:`${(v/maxRev)*100}%`,
                        background: i===6?"#C4531A":"#E8E2D9",
                        minHeight:"4px",
                      }} />
                    <span className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{fontFamily:"'Playfair Display',serif"}} className="text-lg font-bold">AI Insights</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold font-dm-sans"
                  style={{background:"rgba(212,168,75,0.15)",color:"#D4A84B"}}>✦ Premium</span>
              </div>

              {!isPremium ? (
                <div className="text-center py-6">
                  <p className="text-sm font-dm-sans mb-3" style={{color:"#8A8480"}}>
                    AI business insights require Premium
                  </p>
                  <Link href="/pricing"
                    className="px-4 py-2 rounded-xl text-sm font-dm-sans font-semibold text-white inline-block"
                    style={{background:"#C4531A"}}>
                    Upgrade — CA$9.99/mo
                  </Link>
                </div>
              ) : insights ? (
                <div className="space-y-3">
                  {insights.split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm font-dm-sans" style={{color:"#1A1714"}}>
                      <span style={{color:"#C4531A"}} className="flex-shrink-0 mt-0.5">•</span>
                      <span>{line.replace(/^[-•*]\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm font-dm-sans mb-4" style={{color:"#8A8480"}}>
                    Get AI-powered insights about your store performance
                  </p>
                  <button onClick={fetchInsights} disabled={loadingInsights}
                    className="px-4 py-2 rounded-xl text-sm font-dm-sans font-semibold text-white flex items-center gap-2 mx-auto disabled:opacity-50"
                    style={{background:"linear-gradient(135deg,#C4531A,#D4A84B)"}}>
                    {loadingInsights
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
                      : "✦ Generate insights"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top products */}
          <div className="rounded-2xl overflow-hidden mb-8" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
            <div className="px-6 py-4" style={{borderBottom:"1px solid #E8E2D9"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif"}} className="text-lg font-bold">Top products</h2>
            </div>
            {topProducts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>No products yet</p>
              </div>
            ) : (
              <table className="w-full text-sm font-dm-sans">
                <thead>
                  <tr style={{borderBottom:"1px solid #E8E2D9"}}>
                    {["Product","Price","Orders","Revenue","Status"].map(h=>(
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{color:"#8A8480"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(p=>(
                    <tr key={p.productId} style={{borderBottom:"1px solid #F6F1E9"}}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{background:"#F6F1E9"}}>
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                          </div>
                          <p className="font-medium" style={{color:"#1A1714"}}>{p.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold" style={{color:"#1A1714"}}>{formatCurrency(p.price,"CAD")}</td>
                      <td className="px-6 py-4" style={{color:"#8A8480"}}>{p.orders||0}</td>
                      <td className="px-6 py-4 font-semibold" style={{color:"#C4531A"}}>{formatCurrency((p.orders||0)*p.price,"CAD")}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                          style={{
                            background:p.status==="live"?"#2A6B4515":"#C4531A15",
                            color:p.status==="live"?"#2A6B45":"#C4531A",
                          }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
