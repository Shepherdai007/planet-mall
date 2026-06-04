// pages/food.tsx
// ─── PLANET MALL FOOD ────────────────────────────────────────────
// Food & Restaurant marketplace.
// Instant payment release on delivery confirmation.
// Menu-style product layout.

import Head              from "next/head";
import Link              from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db }            from "@/lib/firebase";
import Layout            from "@/components/Layout";
import { useCart }       from "@/context/CartContext";
import { formatCurrency } from "@/lib/helpers";
import { FOOD_CATEGORIES } from "@/lib/escrow";
import type { ProductData } from "@/services/productService";
import type { ShopData }    from "@/services/shopService";
import toast from "react-hot-toast";

export default function FoodPage() {
  const { addItem, openCart } = useCart();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [shops,    setShops]    = useState<Record<string,ShopData>>({});
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    async function load() {
      // Load food products
      const q = query(collection(db,"products"), where("status","==","live"));
      const snap = await getDocs(q);
      const all = snap.docs.map(d=>({productId:d.id,...d.data()} as ProductData));
      const food = all.filter(p => FOOD_CATEGORIES.includes(p.category));
      setProducts(food);

      // Load shops
      const shopIds = [...new Set(food.map(p=>p.shopId))];
      const shopMap: Record<string,ShopData> = {};
      await Promise.all(shopIds.map(async id => {
        const sq = await getDocs(query(collection(db,"shops"), where("shopId","==",id)));
        if (!sq.empty) shopMap[id] = sq.docs[0].data() as ShopData;
      }));
      setShops(shopMap);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = category === "All"
    ? products
    : products.filter(p => p.category === category);

  const foodCategories = ["All", ...FOOD_CATEGORIES];

  function handleAddToCart(p: ProductData) {
    const shop = shops[p.shopId];
    addItem({
      productId: p.productId!,
      shopId:    p.shopId,
      shopName:  shop?.name || "",
      name:      p.name,
      image:     p.images?.[0] || "",
      price:     p.price,
      quantity:  1,
      currency:  "CAD",
    });
    toast.success("Added to cart!");
    openCart();
  }

  return (
    <>
      <Head>
        <title>Planet Mall Food — Order food & meals</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-void pb-20">

          {/* Hero */}
          <div className="relative py-16 px-4 text-center overflow-hidden"
            style={{background:"linear-gradient(135deg, rgba(196,83,26,0.15), rgba(212,168,75,0.1))"}}>
            <div className="absolute inset-0 opacity-[0.03]"
              style={{backgroundImage:"linear-gradient(var(--color-paper) 1px, transparent 1px), linear-gradient(90deg, var(--color-paper) 1px, transparent 1px)",backgroundSize:"40px 40px"}} />
            <div className="relative z-10 max-w-2xl mx-auto">
              <p className="text-4xl mb-4">🍽</p>
              <h1 className="font-syne font-bold text-4xl sm:text-5xl text-paper mb-3">
                Planet Mall Food
              </h1>
              <p className="text-muted font-dm-sans text-lg mb-6">
                Order from restaurants and home cooks near you.<br/>
                Pay securely — money released instantly on delivery.
              </p>
              {/* Instant payment badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-dm-sans font-semibold"
                style={{background:"rgba(42,107,69,0.15)",border:"1px solid rgba(42,107,69,0.3)",color:"#2A6B45"}}>
                ⚡ Instant payment to sellers on delivery confirmation
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

            {/* How food orders work */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
              {[
                {icon:"🛒", label:"Browse & order"},
                {icon:"🔐", label:"Pay securely"},
                {icon:"👨‍🍳", label:"Seller prepares"},
                {icon:"🚗", label:"Delivery"},
                {icon:"⚡", label:"Instant payout"},
              ].map(({icon,label},i)=>(
                <div key={label} className="text-center p-3 rounded-xl" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-[10px] font-dm-sans text-muted">{label}</p>
                  {i < 4 && <p className="text-muted text-xs mt-1">→</p>}
                </div>
              ))}
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
              {foodCategories.map(cat=>(
                <button key={cat} onClick={()=>setCategory(cat)}
                  className="px-4 py-1.5 rounded-full text-xs font-dm-sans font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    background: category===cat?"#C4531A":"rgba(255,255,255,0.04)",
                    color:      category===cat?"#fff":"#8A8480",
                    border:     `1px solid ${category===cat?"#C4531A":"rgba(255,255,255,0.08)"}`,
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_,i)=>(
                  <div key={i} className="rounded-2xl animate-pulse" style={{background:"rgba(255,255,255,0.03)",height:"200px"}} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-5xl mb-4">🍽</p>
                <h2 className="font-syne font-bold text-2xl text-paper mb-2">No food listings yet</h2>
                <p className="text-muted font-dm-sans mb-6">Be the first to list food on Planet Mall!</p>
                <Link href="/auth/signup?role=seller"
                  className="px-6 py-3 rounded-full text-white font-dm-sans font-semibold inline-block"
                  style={{background:"#C4531A"}}>
                  Open a food store
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(p => {
                  const shop = shops[p.shopId];
                  return (
                    <div key={p.productId}
                      className="rounded-2xl overflow-hidden border transition-all hover:border-rust/20 group"
                      style={{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}}>

                      {/* Image */}
                      <Link href={`/product/${p.productId}`}>
                        <div className="h-44 overflow-hidden relative" style={{background:"rgba(255,255,255,0.04)"}}>
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <div className="w-full h-full flex items-center justify-center text-5xl">🍽</div>}
                          {/* Instant payout badge */}
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold font-dm-sans"
                            style={{background:"rgba(42,107,69,0.9)",color:"#fff"}}>
                            ⚡ Instant payout
                          </div>
                        </div>
                      </Link>

                      <div className="p-4">
                        {shop && (
                          <Link href={`/shop/${shop.shopId}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                                {shop.logoURL ? <img src={shop.logoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">🏪</span>}
                              </div>
                              <p className="text-[10px] font-dm-sans text-muted hover:text-rust transition-colors">{shop.name}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-dm-sans" style={{background:"rgba(196,83,26,0.1)",color:"#C4531A"}}>{p.category}</span>
                            </div>
                          </Link>
                        )}

                        <Link href={`/product/${p.productId}`}>
                          <p className="font-dm-sans font-semibold text-paper mb-1 line-clamp-2 leading-snug">{p.name}</p>
                          {p.description && <p className="text-xs text-muted font-dm-sans mb-3 line-clamp-2">{p.description}</p>}
                        </Link>

                        <div className="flex items-center justify-between">
                          <p className="font-syne font-bold text-lg text-paper">{formatCurrency(p.price,"CAD")}</p>
                          <button onClick={()=>handleAddToCart(p)}
                            className="px-4 py-2 rounded-xl text-white text-sm font-dm-sans font-semibold transition-all hover:opacity-90"
                            style={{background:"#C4531A"}}>
                            Order now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
