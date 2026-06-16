// pages/food.tsx
// ─── PLANET MALL FOOD ────────────────────────────────────────────
// Standalone food marketplace — works like classifieds.
// Anyone can post without a shop. Escrow with 2hr instant release.

import Head              from "next/head";
import Link              from "next/link";
import { useEffect, useState } from "react";
import Layout            from "@/components/Layout";
import { useAuth }       from "@/context/AuthContext";
import { useCart }       from "@/context/CartContext";
import { getFoodListings, FOOD_CATEGORIES } from "@/services/foodListingService";
import { timeAgo }       from "@/lib/helpers";
import type { FoodListing } from "@/services/foodListingService";
import toast from "react-hot-toast";

export default function FoodPage() {
  const { isLoggedIn } = useAuth();
  const { addItem, openCart } = useCart();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("All");
  const [city,      setCity]    = useState("");
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => { load(); }, [category]);

  async function load() {
    setLoading(true);
    const results = await getFoodListings({ category, limit: 60 });
    setListings(results);
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const count = results.filter(l => {
      const ts = (l.createdAt as any)?.seconds
        ? (l.createdAt as any).seconds * 1000
        : new Date(l.createdAt as any).getTime();
      return ts >= todayStart.getTime();
    }).length;
    setTodayCount(count);
    setLoading(false);
  }

  const filtered = listings.filter(l => {
    const matchCity = !city || l.city.toLowerCase().includes(city.toLowerCase());
    return matchCity;
  });

  const foodCategories = ["All", ...FOOD_CATEGORIES];

  function handleAddToCart(l: FoodListing) {
    addItem({
      productId: l.id!,
      shopId:    l.sellerId,
      shopName:  l.sellerName,
      name:      l.name,
      image:     l.images?.[0] || "",
      price:     l.price,
      quantity:  1,
      currency:  l.currency as any,
    });
    toast.success("Added to cart!");
    openCart();
  }

  return (
    <>
      <Head>
        <title>Planet Mall Food — Order food & meals</title>
        <meta name="description" content="Order food from home cooks and small restaurants near you. Pay securely — money released instantly on delivery confirmation." />
      </Head>
      <Layout>
        <div className="min-h-screen bg-cream pb-20">

          {/* Hero */}
          <div className="relative py-16 px-4 text-center overflow-hidden" style={{minHeight:"320px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{zIndex:0}}>
              <source src="/food-hero.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0" style={{background:"rgba(10,9,8,0.6)",zIndex:1}} />
            <div className="relative" style={{zIndex:2}}>
              <p className="text-4xl mb-4">🍽</p>
              <h1 className="font-syne font-bold text-4xl sm:text-5xl text-paper mb-3">Planet Mall Food</h1>
              <p className="text-muted font-dm-sans text-lg mb-6">
                Order from restaurants and home cooks near you.<br/>
                Pay securely — money released instantly on delivery.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-dm-sans font-semibold"
                style={{background:"rgba(42,107,69,0.15)",border:"1px solid rgba(42,107,69,0.3)",color:"#2A6B45"}}>
                ⚡ Instant payment to sellers on delivery confirmation
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

            {/* How it works */}
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

            {/* Search + post button */}
            <div className="flex gap-3 mb-6">
              <input value={city} onChange={e=>setCity(e.target.value)}
                placeholder="Filter by city..."
                className="flex-1 px-4 py-3 rounded-xl text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none"
                style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}} />
              <Link href="/food/post"
                className="px-5 py-3 rounded-xl text-white font-dm-sans font-semibold text-sm whitespace-nowrap"
                style={{background:"#C4531A"}}>
                + Post food
              </Link>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
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

            {/* Results count + today badge */}
            <div className="flex items-center gap-3 mb-5">
              <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>
                {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
              </p>
              {todayCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-dm-sans font-bold"
                  style={{background:"rgba(42,107,69,0.1)",color:"#2A6B45"}}>
                  🔥 {todayCount} added today
                </span>
              )}
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
                <Link href="/food/post"
                  className="px-6 py-3 rounded-full text-white font-dm-sans font-semibold inline-block"
                  style={{background:"#C4531A"}}>
                  Post a food listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(l => (
                  <div key={l.id}
                    className="rounded-2xl overflow-hidden border transition-all hover:border-rust/20 group"
                    style={{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}}>

                    <Link href={`/food/${l.id}`}>
                      <div className="h-44 overflow-hidden relative" style={{background:"rgba(255,255,255,0.04)"}}>
                        {l.images?.[0]
                          ? <img src={l.images[0]} alt={l.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-5xl">🍽</div>}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold font-dm-sans"
                          style={{background:"rgba(42,107,69,0.9)",color:"#fff"}}>
                          ⚡ Instant payout
                        </div>
                        {l.status === "sold_out" && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{background:"rgba(0,0,0,0.6)"}}>
                            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600">SOLD OUT</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                          {l.sellerPhoto ? <img src={l.sellerPhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">👤</span>}
                        </div>
                        <p className="text-[10px] font-dm-sans text-muted">{l.sellerName}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-dm-sans" style={{background:"rgba(196,83,26,0.1)",color:"#C4531A"}}>{l.category}</span>
                      </div>

                      <Link href={`/food/${l.id}`}>
                        <p className="font-dm-sans font-semibold text-paper mb-1 line-clamp-2 leading-snug">{l.name}</p>
                        {l.description && <p className="text-xs text-muted font-dm-sans mb-2 line-clamp-2">{l.description}</p>}
                      </Link>

                      <div className="flex items-center justify-between text-[10px] font-dm-sans mb-3" style={{color:"#8A8480"}}>
                        <span>📍 {l.city}</span>
                        <span>⏱ {l.prepTime}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="font-syne font-bold text-lg text-paper">
                          {l.priceType === "contact" ? "Contact for price"
                            : `${l.currency} ${l.price?.toLocaleString()}${l.priceType==="negotiable"?" (OBO)":""}`}
                        </p>
                        {l.priceType === "contact" ? (
                          <Link href={`/food/${l.id}`}
                            className="px-4 py-2 rounded-xl text-white text-sm font-dm-sans font-semibold transition-all hover:opacity-90"
                            style={{background:"#C4531A"}}>
                            View details
                          </Link>
                        ) : (
                          <button onClick={()=>handleAddToCart(l)} disabled={l.status==="sold_out"}
                            className="px-4 py-2 rounded-xl text-white text-sm font-dm-sans font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                            style={{background:"#C4531A"}}>
                            Order now
                          </button>
                        )}
                      </div>
                      {(l.views || 0) > 0 && (
                        <p className="text-[10px] font-dm-sans mt-2" style={{color:"#8A8480"}}>👁 {l.views} views</p>
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
