// pages/seller/dashboard.tsx
// ─── SELLER DASHBOARD (PHASE 2) ──────────────────────────────────
// Design: warm editorial — cream bg, Playfair Display + DM Sans
// Shows: stats, weekly chart, products table, orders list, quick actions

import Head               from "next/head";
import Link               from "next/link";
import { useEffect, useState } from "react";
import { useRouter }      from "next/router";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db }             from "@/lib/firebase";
import { useAuth }        from "@/context/AuthContext";
import ProtectedRoute     from "@/components/ProtectedRoute";
import { getShopByOwner } from "@/services/shopService";
import { getProductsByShop } from "@/services/productService";
import { formatCurrency, timeAgo } from "@/lib/helpers";
import type { ShopData }  from "@/services/shopService";
import type { ProductData } from "@/services/productService";

export default function DashboardPage() {
  return (
    <ProtectedRoute requireRole="seller">
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user, userDoc } = useAuth();
  const router = useRouter();
  const [shop,        setShop]        = useState<ShopData|null>(null);
  const [products,    setProducts]    = useState<ProductData[]>([]);
  const [orders,      setOrders]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getShopByOwner(user.uid).then(s => {
      if (!s) { router.push("/seller/create-shop"); return; }
      setShop(s);
      getProductsByShop(s.shopId!).then(p => { setProducts(p); setLoading(false); });
      // Orders listener
      const q = query(collection(db,"orders"), where("shopId","==",s.shopId), limit(10));
      const unsub = onSnapshot(q, snap => {
        const data = snap.docs.map(d=>({id:d.id,...d.data()}));
        data.sort((a:any,b:any)=>((b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
        setOrders(data);
      });
      return unsub;
    });
  }, [user, router]);

  const totalRevenue = orders.filter((o:any)=>o.status!=="cancelled").reduce((s:number,o:any)=>s+(o.total||0),0);
  const liveProducts = products.filter(p=>p.status==="live").length;

  // Fake weekly data for chart (replace with real analytics in Phase 9)
  const weekData = [12,28,18,45,32,56,38];
  const maxWeek  = Math.max(...weekData);
  const days     = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"#F6F1E9"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard — {shop?.name || "Planet Mall"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{background:"#F6F1E9",color:"#1A1714"}}>

        {/* ── Topbar ─────────────────────────────────────── */}
        <div style={{background:"#1A1714",borderBottom:"1px solid rgba(255,255,255,0.06)"}} className="px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-syne font-bold text-paper text-lg hidden sm:block">Planet Mall</span>
            </div>
            <nav className="hidden md:flex gap-5 text-sm font-dm-sans">
              {[
                {href:"/seller/dashboard", label:"Dashboard"},
                {href:"/seller/products",  label:"Products"},
                {href:"/seller/orders",    label:"Orders"},
                {href:"/seller/analytics", label:"Analytics"},
                {href:"/seller/settings",  label:"Settings"},
              ].map(({href,label})=>(
                <Link key={href} href={href}
                  className="transition-colors"
                  style={{color:router.pathname===href?"#C4531A":"#8A8480"}}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/seller/products?new=1"
              className="px-4 py-2 rounded-full text-sm font-dm-sans font-semibold text-white"
              style={{background:"#C4531A"}}>
              + Add product
            </Link>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{background:"#C4531A20",color:"#C4531A"}}>
                {userDoc?.displayName?.[0]?.toUpperCase()||"S"}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl overflow-hidden z-50"
                  style={{background:"#1A1714",border:"1px solid rgba(255,255,255,0.1)"}}>
                  <Link href="/" className="block px-4 py-2.5 text-sm font-dm-sans hover:bg-white/5"
                    style={{color:"#F2EDE4"}} onClick={() => setProfileOpen(false)}>
                    🏠 Back to Planet Mall
                  </Link>
                  <Link href="/profile" className="block px-4 py-2.5 text-sm font-dm-sans hover:bg-white/5"
                    style={{color:"#F2EDE4"}} onClick={() => setProfileOpen(false)}>
                    👤 Profile
                  </Link>
                  <button onClick={async () => { await import("@/lib/auth").then(m => m.logout()); router.push("/"); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-dm-sans hover:bg-white/5 text-red-400">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Shop header ────────────────────────────── */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{background:"#E8E2D9"}}>
              {shop?.logoURL
                ? <img src={shop.logoURL} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl">🏪</span>}
            </div>
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}} className="text-2xl font-bold">
                {shop?.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-dm-sans" style={{color:"#8A8480"}}>{shop?.category}</span>
                <span className="w-1 h-1 rounded-full" style={{background:"#D4CFC6"}} />
                <span className="text-xs px-2 py-0.5 rounded-full font-dm-sans font-semibold"
                  style={{background:"#2A6B4515",color:"#2A6B45"}}>
                  ● Live
                </span>
                <span className="text-xs font-dm-sans" style={{color:"#8A8480"}}>{shop?.country}</span>
              </div>
            </div>
            <div className="ml-auto">
              <Link href={`/shop/${shop?.shopId}`}
                className="px-4 py-2 text-sm font-dm-sans rounded-xl border transition-all"
                style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                View store →
              </Link>
            </div>
          </div>

          {/* ── Stripe Connect warning banner ────────────── */}
          {!shop?.payoutsEnabled && (
            <Link href="/seller/payouts"
              className="flex items-center gap-3 p-4 rounded-2xl mb-8 transition-all hover:opacity-90"
              style={{background:"#FDECEC",border:"2px solid #D92D20"}}>
              <span className="text-2xl flex-shrink-0">🔴</span>
              <div className="flex-1">
                <p className="font-syne font-bold text-sm" style={{color:"#D92D20"}}>
                  Your store is NOT live — buyers can't find or buy from you yet
                </p>
                <p className="text-xs font-dm-sans mt-0.5" style={{color:"#7A1F17"}}>
                  Connect your bank account to start accepting payments. Takes about 5 minutes.
                </p>
              </div>
              <span className="px-4 py-2 rounded-xl text-xs font-dm-sans font-bold text-white flex-shrink-0"
                style={{background:"#D92D20"}}>
                Connect now →
              </span>
            </Link>
          )}

          {/* ── Stats ──────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {label:"Total revenue",   value:formatCurrency(totalRevenue),      icon:"💰", color:"#C4531A"},
              {label:"Total orders",    value:orders.length.toString(),           icon:"📦", color:"#2A6B45"},
              {label:"Live products",   value:liveProducts.toString(),            icon:"🏷",  color:"#D4A84B"},
              {label:"Store followers", value:(shop?.followers||0).toString(),    icon:"👥", color:"#8A8480"},
            ].map(({label,value,icon,color})=>(
              <div key={label} className="p-5 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl">{icon}</span>
                  <span className="w-2 h-2 rounded-full" style={{background:color}} />
                </div>
                <p className="text-2xl font-bold font-syne" style={{color:"#1A1714"}}>{value}</p>
                <p className="text-xs font-dm-sans mt-1" style={{color:"#8A8480"}}>{label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* ── Weekly chart ─────────────────────────── */}
            <div className="lg:col-span-2 p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
              <div className="flex items-center justify-between mb-6">
                <h2 style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}} className="text-lg font-bold">
                  This week's sales
                </h2>
                <span className="text-xs font-dm-sans px-2.5 py-1 rounded-full" style={{background:"#F6F1E9",color:"#8A8480"}}>Last 7 days</span>
              </div>
              <div className="flex items-end gap-3 h-32">
                {weekData.map((v,i)=>(
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg transition-all"
                      style={{
                        height:`${(v/maxWeek)*100}%`,
                        background:i===6?"#C4531A":"#E8E2D9",
                        minHeight:"4px",
                      }} />
                    <span className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Quick actions ─────────────────────────── */}
            <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}} className="text-lg font-bold mb-5">
                Quick actions
              </h2>
              <div className="space-y-3">
                {[
                  {icon:"➕",label:"Add new product",    href:"/seller/products?new=1"},
                  {icon:"🔴",label:"Go live now",         href:"/seller/livestream"},
                  {icon:"✏️",label:"Edit store",          href:"/seller/settings"},
                  {icon:"📊",label:"View analytics",      href:"/seller/analytics"},
                  {icon:"🤖",label:"AI Store Builder",    href:"/ai/shop-builder"},
                ].map(({icon,label,href})=>(
                  <Link key={href} href={href}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{color:"#1A1714"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#F6F1E9"}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent"}}>
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-dm-sans">{label}</span>
                    <span className="ml-auto text-xs" style={{color:"#D4CFC6"}}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Products table ──────────────────────────── */}
          <div className="rounded-2xl overflow-hidden mb-8" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
            <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:"1px solid #E8E2D9"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}} className="text-lg font-bold">
                Products ({products.length})
              </h2>
              <Link href="/seller/products?new=1"
                className="text-sm font-dm-sans font-medium"
                style={{color:"#C4531A"}}>
                + Add product
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">🏷</p>
                <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>No products yet</p>
                <Link href="/seller/products?new=1"
                  className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-dm-sans font-semibold text-white"
                  style={{background:"#C4531A"}}>
                  Add your first product
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-dm-sans">
                  <thead>
                    <tr style={{borderBottom:"1px solid #E8E2D9"}}>
                      {["Product","Price","Stock","Status","Orders",""].map(h=>(
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{color:"#8A8480"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0,8).map(p=>(
                      <tr key={p.productId} style={{borderBottom:"1px solid #F6F1E9"}}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                              style={{background:"#F6F1E9"}}>
                              {p.images?.[0]
                                ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                            </div>
                            <div>
                              <p className="font-medium" style={{color:"#1A1714"}}>{p.name}</p>
                              <p className="text-xs" style={{color:"#8A8480"}}>{p.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold" style={{color:"#1A1714"}}>
                          {formatCurrency(p.price, p.currency as any)}
                        </td>
                        <td className="px-6 py-4">
                          <span style={{color:p.stock<=5?"#C4531A":"#8A8480"}}>{p.stock}</span>
                          {p.stock<=5 && <span className="ml-1 text-[10px] font-semibold" style={{color:"#C4531A"}}>Low</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background:p.status==="live"?"#2A6B4515":p.status==="draft"?"#D4A84B15":"#C4531A15",
                              color:p.status==="live"?"#2A6B45":p.status==="draft"?"#D4A84B":"#C4531A",
                            }}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4" style={{color:"#8A8480"}}>{p.orders||0}</td>
                        <td className="px-6 py-4">
                          <Link href={`/seller/products?edit=${p.productId}`}
                            className="text-xs font-medium" style={{color:"#C4531A"}}>
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Recent orders ────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
            <div className="px-6 py-4" style={{borderBottom:"1px solid #E8E2D9"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#1A1714"}} className="text-lg font-bold">
                Recent orders
              </h2>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>No orders yet — share your store to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-dm-sans">
                  <thead>
                    <tr style={{borderBottom:"1px solid #E8E2D9"}}>
                      {["Order ID","Items","Total","Status","Date"].map(h=>(
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{color:"#8A8480"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o:any)=>(
                      <tr key={o.id} style={{borderBottom:"1px solid #F6F1E9"}}>
                        <td className="px-6 py-4 font-mono text-xs" style={{color:"#8A8480"}}>#{o.id.slice(0,8)}</td>
                        <td className="px-6 py-4" style={{color:"#1A1714"}}>{o.items?.length||0} item(s)</td>
                        <td className="px-6 py-4 font-semibold" style={{color:"#1A1714"}}>{formatCurrency(o.total||0)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                            style={{
                              background:o.status==="delivered"?"#2A6B4515":o.status==="pending"?"#D4A84B15":"#C4531A15",
                              color:o.status==="delivered"?"#2A6B45":o.status==="pending"?"#D4A84B":"#C4531A",
                            }}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs" style={{color:"#8A8480"}}>{timeAgo(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
