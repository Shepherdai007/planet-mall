// pages/classifieds/index.tsx
// ─── CLASSIFIEDS BROWSE PAGE ────────────────────────────────────
// Kijiji-style listings. Location based, category filters,
// search, featured listings at top.
// Design: cream bg, editorial feel.

import Head              from "next/head";
import Link              from "next/link";
import { useEffect, useState } from "react";
import { useRouter }     from "next/router";
import Layout            from "@/components/Layout";
import { useAuth }       from "@/context/AuthContext";
import { getClassifieds, CLASSIFIED_CATEGORIES } from "@/services/classifiedService";
import { formatCurrency, timeAgo } from "@/lib/helpers";
import type { Classified } from "@/services/classifiedService";

const CATEGORIES = ["All", ...Object.keys(CLASSIFIED_CATEGORIES)];

const CONDITION_LABELS: Record<string, string> = {
  new:        "New",
  like_new:   "Like New",
  good:       "Good",
  fair:       "Fair",
  parts_only: "Parts Only",
  na:         "N/A",
};

export default function ClassifiedsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [listings,  setListings]  = useState<Classified[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [city,      setCity]      = useState("");

  useEffect(() => {
    load();
  }, [category]);

  async function load() {
    setLoading(true);
    const results = await getClassifieds({ category, limit: 60 });
    setListings(results);
    setLoading(false);
  }

  const filtered = listings.filter(l => {
    const matchSearch = !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase());
    const matchCity = !city || l.city.toLowerCase().includes(city.toLowerCase());
    return matchSearch && matchCity;
  });

  return (
    <>
      <Head>
        <title>Classifieds — Planet Mall</title>
        <meta name="description" content="Buy and sell locally on Planet Mall Classifieds. Cars, real estate, jobs, services and more." />
      </Head>
      <Layout>
        <div className="min-h-screen pb-20" style={{background:"#F6F1E9",color:"#1A1714"}}>

          {/* Hero */}
          <div className="py-10 px-4 text-center" style={{background:"#1A1714"}}>
            <h1 className="font-syne font-bold text-3xl sm:text-4xl text-paper mb-2">
              Planet Mall Classifieds
            </h1>
            <p className="text-muted font-dm-sans mb-6">Buy and sell locally — safely.</p>

            {/* Search bar */}
            <div className="max-w-2xl mx-auto flex gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)"}}
                  onFocus={e=>e.target.style.borderColor="rgba(196,83,26,0.5)"}
                  onBlur={e =>e.target.style.borderColor="rgba(255,255,255,0.1)"} />
              </div>
              <input value={city} onChange={e=>setCity(e.target.value)}
                placeholder="City..."
                className="w-32 px-4 py-3 rounded-xl text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none"
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)"}}
                onFocus={e=>e.target.style.borderColor="rgba(196,83,26,0.5)"}
                onBlur={e =>e.target.style.borderColor="rgba(255,255,255,0.1)"} />
              <Link href="/classifieds/post"
                className="px-5 py-3 rounded-xl text-white font-dm-sans font-semibold text-sm whitespace-nowrap"
                style={{background:"#C4531A"}}>
                + Post Ad
              </Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">

            {/* Category icons grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2 mb-6">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={()=>setCategory(cat)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
                  style={{
                    background: category===cat ? "#C4531A" : "#fff",
                    border:     `1px solid ${category===cat ? "#C4531A" : "#E8E2D9"}`,
                  }}>
                  <span className="text-xl">{getCategoryIcon(cat)}</span>
                  <span className="text-[9px] font-dm-sans text-center leading-tight"
                    style={{color: category===cat ? "#fff" : "#8A8480"}}>
                    {cat === "All" ? "All" : cat.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>
                {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
                {category !== "All" ? ` in ${category}` : ""}
                {city ? ` near ${city}` : ""}
              </p>
              <Link href="/classifieds/post"
                className="text-sm font-dm-sans font-semibold"
                style={{color:"#C4531A"}}>
                + Post free ad
              </Link>
            </div>

            {/* Listings grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_,i)=>(
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                    <div className="h-40 bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-5xl mb-4">📋</p>
                <h2 className="font-syne font-bold text-2xl mb-2" style={{color:"#1A1714"}}>No listings yet</h2>
                <p className="font-dm-sans mb-6" style={{color:"#8A8480"}}>Be the first to post in this category!</p>
                <Link href="/classifieds/post"
                  className="px-6 py-3 rounded-full text-white font-dm-sans font-semibold inline-block"
                  style={{background:"#C4531A"}}>
                  Post free ad
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(listing => (
                  <ClassifiedCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}

function ClassifiedCard({ listing }: { listing: Classified }) {
  return (
    <Link href={`/classifieds/${listing.id}`}
      className="rounded-2xl overflow-hidden block transition-all hover:shadow-md group"
      style={{background:"#fff",border:"1px solid #E8E2D9"}}>

      {/* Image */}
      <div className="h-40 overflow-hidden relative" style={{background:"#F6F1E9"}}>
        {listing.images?.[0] ? (
          <img src={listing.images[0]} alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {getCategoryIcon(listing.category)}
          </div>
        )}
        {listing.featured && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full text-white"
            style={{background:"#D4A84B"}}>
            ⭐ Featured
          </span>
        )}
        {listing.useEscrow && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full"
            style={{background:"rgba(42,107,69,0.9)",color:"#fff"}}>
            🔐 Escrow
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-dm-sans font-semibold text-sm mb-1 line-clamp-2 leading-snug" style={{color:"#1A1714"}}>
          {listing.title}
        </p>
        <p className="font-syne font-bold text-lg" style={{color:"#C4531A"}}>
          {listing.priceType === "free" ? "FREE"
            : listing.priceType === "contact" ? "Contact for price"
            : `${formatCurrency(listing.price, "CAD")}${listing.priceType === "negotiable" ? " (OBO)" : ""}`}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>
            📍 {listing.city}
          </p>
          <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>
            {timeAgo(listing.createdAt as any)}
          </p>
        </div>
        {listing.condition !== "na" && (
          <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-dm-sans"
            style={{background:"#F6F1E9",color:"#8A8480"}}>
            {CONDITION_LABELS[listing.condition]}
          </span>
        )}
      </div>
    </Link>
  );
}

function getCategoryIcon(cat: string): string {
  const icons: Record<string,string> = {
    "All":              "🏠",
    "Cars & Vehicles":  "🚗",
    "Real Estate":      "🏡",
    "Jobs":             "💼",
    "Services":         "🔧",
    "Electronics":      "📱",
    "Fashion":          "👗",
    "Home & Garden":    "🛋",
    "Pets":             "🐾",
    "Sports & Outdoors":"⚽",
    "Free Stuff":       "🎁",
    "Other":            "📦",
  };
  return icons[cat] || "📦";
}
