// pages/product/[productId].tsx
// ─── PRODUCT DETAIL PAGE (PHASE 3 + 4) ───────────────────────────
// Includes: image gallery, qty selector, add to cart,
//           message seller button (Phase 4)

import Head              from "next/head";
import Link              from "next/link";
import { useRouter }     from "next/router";
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment } from "firebase/firestore";
import { db }            from "@/lib/firebase";
import Layout            from "@/components/Layout";
import { useCart }       from "@/context/CartContext";
import { useAuth }       from "@/context/AuthContext";
import { formatCurrency } from "@/lib/helpers";
import { getOrCreateConversation } from "@/services/messageService";
import ShareButton from "@/components/ShareButton";
import ReviewSection from "@/components/ReviewSection";
import BuyerProtectionBadge from "@/components/BuyerProtectionBadge";
import ReportButton from "@/components/ReportButton";
import type { ProductData } from "@/services/productService";
import type { ShopData }    from "@/services/shopService";
import toast from "react-hot-toast";

export default function ProductPage() {
  const router = useRouter();
  const { productId } = router.query;
  const { addItem, openCart } = useCart();
  const { user, userDoc }     = useAuth();
  const [product,  setProduct]  = useState<ProductData|null>(null);
  const [shop,     setShop]     = useState<ShopData|null>(null);
  const [loading,  setLoading]  = useState(true);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [qty,      setQty]      = useState(1);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!productId) return;
    async function load() {
      const snap = await getDoc(doc(db,"products",productId as string));
      if (!snap.exists()) { setLoading(false); return; }
      const p = {productId:snap.id,...snap.data()} as ProductData;
      setProduct(p);
      const sq = await getDocs(query(collection(db,"shops"), where("shopId","==",p.shopId)));
      if (!sq.empty) setShop(sq.docs[0].data() as ShopData);
      setLoading(false);
      // Increment view count (fire and forget)
      updateDoc(doc(db,"products",productId as string), { views: increment(1) }).catch(()=>{});
    }
    load();
  }, [productId]);

  if (loading) return (
    <Layout><div className="min-h-screen bg-void flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
    </div></Layout>
  );

  if (!product) return (
    <Layout><div className="min-h-screen bg-void flex items-center justify-center text-center px-4">
      <div><p className="text-4xl mb-4">📦</p>
        <h1 className="font-syne font-bold text-2xl text-paper mb-2">Product not found</h1>
        <Link href="/explore" className="text-rust text-sm font-dm-sans">Browse marketplace →</Link>
      </div>
    </div></Layout>
  );

  function handleAddToCart() {
    addItem({ productId:product!.productId!, shopId:product!.shopId, shopName:shop?.name||"", name:product!.name, image:product!.images?.[0]||"", price:product!.price, quantity:qty, currency:(product!.currency as any)||"CAD" });
    toast.success("Added to cart");
    openCart();
  }

  async function handleMessageSeller() {
    if (!user || !userDoc) { router.push("/auth/login"); return; }
    if (!shop) return;
    setMessaging(true);
    try {
      const convId = await getOrCreateConversation(
        user.uid, userDoc.displayName, userDoc.photoURL || "",
        shop.ownerId, shop.name, shop.logoURL,
        shop.shopId!, shop.name, shop.logoURL
      );
      router.push(`/messages/${convId}`);
    } catch(e) {
      toast.error("Could not open chat");
    } finally {
      setMessaging(false);
    }
  }

  const images   = product.images?.length ? product.images : [""];
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  return (
    <>
      <Head>
        <title>{product.name} — Planet Mall</title>
        <meta name="description" content={`${product.currency || "CAD"} ${product.price?.toLocaleString()} · ${product.description?.slice(0,120)}...`} />

        {/* Open Graph — WhatsApp, Facebook, Telegram */}
        <meta property="og:type"         content="product" />
        <meta property="og:site_name"    content="Planet Mall" />
        <meta property="og:title"        content={`${product.name} — ${product.currency || "CAD"} ${product.price?.toLocaleString()}`} />
        <meta property="og:description"  content={product.description?.slice(0,150) || "Shop on Planet Mall"} />
        <meta property="og:image"        content={product.images?.[0] || "https://planetmallshop.com/logo.jpg"} />
        <meta property="og:image:width"  content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url"          content={`https://planetmallshop.com/product/${product.productId}`} />

        {/* Twitter / X */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={`${product.name} — Planet Mall`} />
        <meta name="twitter:description" content={`${product.currency || "CAD"} ${product.price?.toLocaleString()} · Shop on Planet Mall`} />
        <meta name="twitter:image"       content={product.images?.[0] || "https://planetmallshop.com/logo.jpg"} />
      </Head>
      <Layout>
        <div className="min-h-screen bg-void pt-8 pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-dm-sans text-muted mb-8">
              <Link href="/explore" className="hover:text-paper">Explore</Link>
              <span>/</span>
              {shop && <><Link href={`/shop/${shop.shopId}`} className="hover:text-paper">{shop.name}</Link><span>/</span></>}
              <span className="text-paper">{product.name}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Images */}
              <div>
                <div className="aspect-square rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] mb-3">
                  {images[imgIdx]
                    ? <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2">
                    {images.map((img,i)=>(
                      <button key={i} onClick={()=>setImgIdx(i)}
                        className="w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
                        style={{borderColor:i===imgIdx?"#C4531A":"transparent"}}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                {shop && (
                  <Link href={`/shop/${shop.shopId}`} className="flex items-center gap-2 mb-4 group">
                    <div className="w-7 h-7 rounded-lg overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                      {shop.logoURL ? <img src={shop.logoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-xs flex w-full h-full items-center justify-center">🏪</span>}
                    </div>
                    <span className="text-xs font-dm-sans text-muted group-hover:text-rust transition-colors">{shop.name}</span>
                  </Link>
                )}

                <h1 className="font-syne font-bold text-3xl text-paper mb-4 leading-tight">{product.name}</h1>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="font-syne font-bold text-3xl text-paper">{formatCurrency(product.price,"CAD")}</span>
                  {product.comparePrice && <span className="text-lg text-muted line-through font-dm-sans">{formatCurrency(product.comparePrice,"CAD")}</span>}
                  {discount > 0 && <span className="px-2 py-0.5 bg-rust text-white text-xs font-bold rounded-full">{discount}% OFF</span>}
                </div>

                <p className="text-muted font-dm-sans text-sm leading-relaxed mb-8">{product.description}</p>

                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full" style={{background:product.stock>0?"#2A6B45":"#C4531A"}} />
                  <span className="text-sm font-dm-sans" style={{color:product.stock>0?"#2A6B45":"#C4531A"}}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </span>
                </div>

                {/* Qty + Add to cart */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl border" style={{borderColor:"rgba(255,255,255,0.1)"}}>
                    <button onClick={()=>setQty(q=>Math.max(1,q-1))} className="text-paper/60 hover:text-paper">−</button>
                    <span className="font-syne font-bold text-paper w-6 text-center">{qty}</span>
                    <button onClick={()=>setQty(q=>Math.min(product.stock,q+1))} className="text-paper/60 hover:text-paper">+</button>
                  </div>
                  <button onClick={handleAddToCart} disabled={product.stock===0}
                    className="flex-1 py-3.5 rounded-xl text-white font-dm-sans font-semibold transition-all disabled:opacity-40 hover:opacity-90"
                    style={{background:"#C4531A"}}>
                    Add to cart — {formatCurrency(product.price*qty,"CAD")}
                  </button>
                </div>

                {/* Message seller */}
                {shop && user?.uid !== shop.ownerId && (
                  <button onClick={handleMessageSeller} disabled={messaging}
                    className="w-full py-3 rounded-xl text-sm font-dm-sans font-medium border transition-all hover:bg-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{borderColor:"rgba(255,255,255,0.1)",color:"#F2EDE4"}}>
                    {messaging
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Opening chat...</>
                      : <>💬 Message {shop.name}</>}
                  </button>
                )}

                {/* Share product */}
                <ShareButton
                  url={typeof window !== "undefined" ? window.location.href : ""}
                  title={product.name}
                  text={`Check out ${product.name} on Planet Mall — ${formatCurrency(product.price, "CAD")}`}
                  variant="full"
                />

                {/* Buyer protection */}
                <BuyerProtectionBadge />

                {/* Report */}
                <div className="flex justify-end">
                  <ReportButton
                    type="product"
                    targetId={product.productId!}
                    targetName={product.name}
                  />
                </div>

                {/* Product details */}
                <div className="space-y-2 pt-6 mt-4" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                  {[
                    {label:"Category",  value:product.category},
                    {label:"Shipping",  value:product.shipping},
                    {label:"SKU",       value:product.sku||"—"},
                  ].map(({label,value})=>(
                    <div key={label} className="flex justify-between text-sm font-dm-sans">
                      <span className="text-muted">{label}</span>
                      <span className="text-paper capitalize">{value}</span>
                    </div>
                  ))}
                  {shop?.returnPolicy && (
                    <div className="flex justify-between text-sm font-dm-sans">
                      <span className="text-muted">Returns</span>
                      <span className="text-paper text-right max-w-xs">{shop.returnPolicy}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <ReviewSection productId={product.productId!} shopId={product.shopId} />
          </div>
        </div>
      </Layout>
    </>
  );
}
