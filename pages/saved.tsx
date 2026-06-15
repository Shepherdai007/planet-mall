// pages/saved.tsx
// ─── SAVED / FAVOURITE LISTINGS PAGE ─────────────────────────────

import Head         from "next/head";
import Link         from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Layout        from "@/components/Layout";
import { useAuth }   from "@/context/AuthContext";
import { getSavedListings, unsaveListing } from "@/services/favoritesService";
import type { FavoriteItem } from "@/services/favoritesService";
import toast         from "react-hot-toast";

export default function SavedPage() {
  const { user, isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [items,    setItems]    = useState<FavoriteItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) { router.push("/auth/login?redirect=/saved"); return; }
    getSavedListings(user!.uid).then(data => { setItems(data); setFetching(false); });
  }, [user, isLoggedIn, loading]);

  async function handleUnsave(id: string) {
    if (!user) return;
    await unsaveListing(user.uid, id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Removed from saved");
  }

  return (
    <>
      <Head><title>Saved Listings — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-5xl mx-auto pt-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-syne font-bold text-3xl" style={{color:"#1A1714"}}>Saved listings</h1>
                {!fetching && (
                  <p className="text-sm font-dm-sans mt-1" style={{color:"#8A8480"}}>
                    {items.length} saved item{items.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <Link href="/classifieds"
                className="px-4 py-2 rounded-xl text-sm font-dm-sans font-semibold"
                style={{background:"#C4531A",color:"#fff"}}>
                Browse listings
              </Link>
            </div>

            {fetching ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_,i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                    <div className="h-40 bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{background:"rgba(196,83,26,0.1)"}}>
                  <span className="text-3xl">🤍</span>
                </div>
                <h2 className="font-syne font-bold text-2xl mb-2" style={{color:"#1A1714"}}>No saved listings yet</h2>
                <p className="font-dm-sans mb-6" style={{color:"#8A8480"}}>
                  Tap the heart ❤️ on any listing to save it here for later.
                </p>
                <Link href="/classifieds"
                  className="px-6 py-3 rounded-full text-white font-dm-sans font-semibold inline-block"
                  style={{background:"#C4531A"}}>
                  Browse classifieds
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map(item => (
                  <div key={item.id} className="rounded-2xl overflow-hidden relative group"
                    style={{background:"#fff",border:"1px solid #E8E2D9"}}>

                    {/* Unsave button */}
                    <button
                      onClick={() => handleUnsave(item.id)}
                      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all"
                      style={{background:"rgba(255,255,255,0.9)"}}>
                      ❤️
                    </button>

                    <Link href={`/classifieds/${item.id}`}>
                      <div className="h-40 overflow-hidden" style={{background:"#F6F1E9"}}>
                        {item.image
                          ? <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-4xl">📋</div>}
                      </div>
                      <div className="p-3">
                        <p className="font-dm-sans font-semibold text-sm mb-1 line-clamp-2" style={{color:"#1A1714"}}>
                          {item.title}
                        </p>
                        <p className="font-syne font-bold text-lg" style={{color:"#C4531A"}}>
                          {item.priceType === "free" ? "FREE"
                            : item.priceType === "contact" ? "Contact for price"
                            : `${item.currency || "CAD"} ${item.price?.toLocaleString()}`}
                        </p>
                        <p className="text-[10px] font-dm-sans mt-1 truncate" style={{color:"#8A8480"}}>
                          📍 {item.city}
                        </p>
                      </div>
                    </Link>
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
