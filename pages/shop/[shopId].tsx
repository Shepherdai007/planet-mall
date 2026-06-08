// pages/shop/[shopId].tsx
// ─── PUBLIC SHOP PAGE (PHASE 3) ──────────────────────────────────

import Head              from "next/head";
import Link              from "next/link";
import { useRouter }     from "next/router";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db }            from "@/lib/firebase";
import Layout            from "@/components/Layout";
import { useCart }       from "@/context/CartContext";
import { formatCurrency } from "@/lib/helpers";
import { FOOD_CATEGORIES } from "@/lib/escrow";
import FollowButton from "@/components/FollowButton";
import type { ShopData }    from "@/services/shopService";
import type { ProductData } from "@/services/productService";
import toast from "react-hot-toast";

export default function ShopPage() {
  const router = useRouter();
  const { shopId } = router.query;
  const { addItem, openCart } = useCart();
  const [shop,     setShop]     = useState<ShopData|null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!shopId) return;
    async function load() {
      const sq = await getDocs(query(collection(db,"shops"), where("shopId","==",shopId)));
      if (sq.empty) { setLoading(false); return; }
      const shopData = sq.docs[0].data() as ShopData;
      setShop(shopData);

      const pq = await getDocs(query(collection(db,"products"), where("shopId","==",shopId), where("status","==","live")));
      setProducts(pq.docs.map(d=>({productId:d.id,...d.data()} as ProductData)));
      setLoading(false);
    }
    load();
  }, [shopId]);

  if (loading) return (
    <Layout>
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    </Layout>
  );

  if (!shop) return (
    <Layout>
      <div className="min-h-screen bg-void flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-4">🏪</p>
          <h1 className="font-syne font-bold text-2xl text-paper mb-2">Shop not found</h1>
          <Link href="/explore" className="text-rust text-sm font-dm-sans">Browse marketplace →</Link>
        </div>
      </div>
    </Layout>
  );

  function handleAddToCart(p: ProductData) {
    addItem({ productId:p.productId!, shopId:p.shopId, shopName:shop!.name, name:p.name, image:p.images?.[0]||"", price:p.price, quantity:1, currency:(p.currency as any)||"CAD" });
    toast.success("Added to cart");
    openCart();
  }

  return (
    <>
      <Head><title>{shop.name} — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen bg-void">
          {/* Banner */}
          <div className="h-48 sm:h-64 relative overflow-hidden"
            style={{background:shop.bannerURL?`url(${shop.bannerURL}) center/cover`:`linear-gradient(135deg, ${shop.brandColor}20, ${shop.accentColor}20)`}}>
            <div className="absolute inset-0" style={{background:"linear-gradient(to bottom, transparent 50%, #0A0908)"}} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-20">
            {/* Shop header */}
            <div className="flex items-end gap-4 mb-8">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 flex-shrink-0" style={{borderColor:"#0A0908",background:"#1A1714"}}>
                {shop.logoURL
                  ? <img src={shop.logoURL} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">🏪</div>}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-syne font-bold text-2xl text-paper">{shop.name}</h1>
                  {shop.verified && <span className="text-xs px-2 py-0.5 rounded-full font-dm-sans" style={{background:"#2A6B4520",color:"#2A6B45"}}>✓ Verified</span>}
                </div>
                <p className="text-sm text-muted font-dm-sans">{shop.tagline}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted font-dm-sans">
                  <span>{shop.city}{shop.city&&shop.country?", ":""}{shop.country}</span>
                  <span>·</span>
                  <span>{products.length} products</span>
                  <span>·</span>
                  <span>{shop.followers||0} followers</span>
                </div>
                <div className="mt-3">
                  <FollowButton shopId={shop.shopId!} shopName={shop.name} />
                </div>
              </div>
            </div>

            {/* Products */}
            <h2 className="font-syne font-semibold text-lg text-paper mb-5">All products</h2>
            {products.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-3xl mb-3">📦</p>
                <p className="text-sm text-muted font-dm-sans">No products yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p=>(
                  <div key={p.productId} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-rust/20 transition-all group">
                    <Link href={`/product/${p.productId}`}>
                      <div className="aspect-square bg-white/[0.03] overflow-hidden">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
                      </div>
                    </Link>
                    <div className="p-4">
                      <p className="text-sm font-dm-sans font-medium text-paper mb-2 line-clamp-2">{p.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-syne font-bold text-paper text-sm">{formatCurrency(p.price,"CAD")}</p>
                        <button onClick={()=>handleAddToCart(p)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-rust transition-all"
                          aria-label="Add to cart">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-paper">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                          </svg>
                        </button>
                      </div>
                      {(p.views || 0) > 0 && (
                        <p className="text-[10px] font-dm-sans mt-2" style={{color:"#8A8480"}}>
                          👁 {(p.views || 0).toLocaleString()} {p.views === 1 ? "view" : "views"}
                        </p>
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
