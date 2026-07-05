// pages/explore.tsx
// ─── MARKETPLACE / EXPLORE PAGE (PHASE 3) ───────────────────────
// Design: cream bg, editorial grid, rust accent
// Features: search, category filter, sort, product cards

import Head              from "next/head";
import Link              from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db }            from "@/lib/firebase";
import Layout            from "@/components/Layout";
import { useCart }       from "@/context/CartContext";
import { formatCurrency } from "@/lib/helpers";
import type { ProductData } from "@/services/productService";
import type { ShopData }    from "@/services/shopService";
import toast from "react-hot-toast";

const CATEGORIES = [
  "All", "Fashion & Apparel", "Electronics", "Home & Living", "Beauty & Health",
  "Food & Beverages", "Sports & Outdoors", "Art & Crafts", "Books & Media",
  "Toys & Games", "Digital Products", "Other",
];

const SORTS = [
  { label: "Newest",       value: "newest" },
  { label: "Price: Low",   value: "price_asc" },
  { label: "Price: High",  value: "price_desc" },
  { label: "Most ordered", value: "orders" },
];

export default function ExplorePage() {
  const { addItem, openCart } = useCart();
  const [products,  setProducts]  = useState<(ProductData & { shopName?: string })[]>([]);
  const [shops,     setShops]     = useState<Record<string, ShopData>>({});
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [sort,      setSort]      = useState("newest");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load all live products — only from Premium/Business sellers
        // Free sellers: products hidden from marketplace (must upgrade)
        const q = query(collection(db, "products"), where("status", "==", "live"), limit(100));
        const snap = await getDocs(q);
        const prods = snap.docs.map(d => ({ productId: d.id, ...d.data() } as ProductData));

        // Load shops for these products
        const shopIds = [...new Set(prods.map(p => p.shopId))];
        const shopMap: Record<string, ShopData> = {};
        await Promise.all(shopIds.map(async id => {
          const sq = await getDocs(query(collection(db, "shops"), where("shopId", "==", id)));
          if (!sq.empty) shopMap[id] = sq.docs[0].data() as ShopData;
        }));
        setShops(shopMap);

        // Hide products whose shop hasn't finished connecting payouts yet —
        // buyers should never see (or try to buy from) a store that can't
        // actually receive payment.
        const visibleProds = prods.filter(p => shopMap[p.shopId]?.payoutsEnabled === true);
        setProducts(visibleProds);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter + sort client-side
  let filtered = products.filter(p => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === "price_asc")  return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "orders")     return (b.orders || 0) - (a.orders || 0);
    return 0; // newest — already sorted by Firestore
  });

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
      currency:  (p.currency as any) || "CAD",
    });
    toast.success("Added to cart");
    openCart();
  }

  return (
    <>
      <Head>
        <title>Explore — Planet Mall</title>
      </Head>

      <Layout>
        <div className="min-h-screen bg-cream pt-6 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">

            {/* ── Header ───────────────────────────────── */}
            <div className="mb-8">
              <h1 className="font-syne font-bold text-3xl text-ink mb-1">Explore</h1>
              <p className="text-sm font-dm-sans text-muted">
                {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {/* ── Search + sort bar ────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm font-dm-sans text-ink placeholder:text-muted/40 focus:outline-none focus:border-rust/50"
                />
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="px-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm font-dm-sans text-ink focus:outline-none"
              >
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* ── Category tabs ────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="px-4 py-1.5 rounded-full text-xs font-dm-sans font-medium whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    background: category === cat ? "#C4531A" : "rgba(255,255,255,0.04)",
                    color:      category === cat ? "#fff"     : "#8A8480",
                    border:     `1px solid ${category === cat ? "#C4531A" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* ── Grid ─────────────────────────────────── */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden animate-pulse">
                    <div className="aspect-square bg-white/[0.04]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                      <div className="h-3 bg-white/[0.06] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-4xl mb-4">🔍</p>
                <p className="font-syne font-semibold text-ink mb-2">No products found</p>
                <p className="text-sm text-muted font-dm-sans">
                  {search ? `No results for "${search}"` : "No products in this category yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(p => (
                  <ProductCard
                    key={p.productId}
                    product={p}
                    shop={shops[p.shopId]}
                    onAddToCart={() => handleAddToCart(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}

function ProductCard({
  product, shop, onAddToCart,
}: {
  product: ProductData;
  shop?: ShopData;
  onAddToCart: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-rust/20 transition-all"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <Link href={`/product/${product.productId}`}>
        <div className="aspect-square bg-white/[0.03] overflow-hidden relative">
          {product.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
          )}
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-rust text-white text-[10px] font-bold rounded-full">
              SALE
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        {shop && (
          <Link href={`/shop/${shop.shopId}`}>
            <p className="text-[10px] font-dm-sans text-muted mb-1 hover:text-rust transition-colors truncate">
              {shop.name}
            </p>
          </Link>
        )}
        <Link href={`/product/${product.productId}`}>
          <p className="text-sm font-dm-sans font-medium text-ink mb-2 line-clamp-2 leading-snug">
            {product.name}
          </p>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-syne font-bold text-ink text-sm">
              {formatCurrency(product.price, (product.currency as any) || "CAD")}
            </p>
            {product.comparePrice && product.comparePrice > product.price && (
              <p className="text-[10px] text-muted line-through">
                {formatCurrency(product.comparePrice, (product.currency as any) || "CAD")}
              </p>
            )}
          </div>
          <button
            onClick={onAddToCart}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: hovered ? "#C4531A" : "rgba(255,255,255,0.06)" }}
            aria-label="Add to cart"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </button>
        </div>
        {(product.views || 0) > 0 && (
          <p className="text-[10px] font-dm-sans mt-2" style={{color:"#8A8480"}}>
            👁 {(product.views || 0).toLocaleString()} {product.views === 1 ? "view" : "views"}
          </p>
        )}
      </div>
    </div>
  );
}
