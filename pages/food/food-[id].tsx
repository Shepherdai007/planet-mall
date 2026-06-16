// pages/food/[id].tsx
// ─── FOOD LISTING DETAIL PAGE ────────────────────────────────────
// Add to cart uses sellerId as the cart "shopId" — checkout already
// groups by shopId, so escrow + order creation work unmodified.

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useEffect, useState } from "react";
import Layout         from "@/components/Layout";
import { useAuth }    from "@/context/AuthContext";
import { useCart }    from "@/context/CartContext";
import { getFoodListing, updateFoodListing } from "@/services/foodListingService";
import { getOrCreateConversation } from "@/services/messageService";
import { timeAgo }    from "@/lib/helpers";
import ShareButton    from "@/components/ShareButton";
import ReportButton   from "@/components/ReportButton";
import BuyerProtectionBadge from "@/components/BuyerProtectionBadge";
import toast           from "react-hot-toast";
import type { FoodListing } from "@/services/foodListingService";

export default function FoodDetailPage({ ogData }: { ogData?: any }) {
  const router  = useRouter();
  const { id }  = router.query;
  const { user, userDoc } = useAuth();
  const { addItem, openCart } = useCart();

  const [listing,  setListing]  = useState<FoodListing|null>(null);
  const [loading,  setLoading]  = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty,       setQty]       = useState(1);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!id) return;
    getFoodListing(id as string).then(l => { setListing(l); setLoading(false); });
  }, [id]);

  function handleAddToCart() {
    if (!listing) return;
    addItem({
      productId: listing.id!,
      shopId:    listing.sellerId,     // sellerId stands in for shopId at checkout
      shopName:  listing.sellerName,
      name:      listing.name,
      image:     listing.images?.[0] || "",
      price:     listing.price,
      quantity:  qty,
      currency:  listing.currency as any,
    });
    toast.success("Added to cart!");
    openCart();
  }

  async function handleMessage() {
    if (!user) { router.push("/auth/login"); return; }
    if (!listing) return;
    setMessaging(true);
    try {
      const convId = await getOrCreateConversation(
        user.uid, userDoc?.displayName || user.displayName || "User", userDoc?.photoURL || "",
        listing.sellerId, listing.sellerName, listing.sellerPhoto,
        listing.sellerId, listing.sellerName, listing.sellerPhoto,
        listing.id!, listing.name
      );
      router.push(`/messages/${convId}`);
    } catch { toast.error("Failed to open chat"); }
    finally { setMessaging(false); }
  }

  async function handleToggleSoldOut() {
    if (!listing) return;
    const newStatus = listing.status === "sold_out" ? "active" : "sold_out";
    await updateFoodListing(listing.id!, { status: newStatus });
    setListing({ ...listing, status: newStatus });
    toast.success(newStatus === "sold_out" ? "Marked as sold out" : "Marked as available");
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#F6F1E9"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    </Layout>
  );

  if (!listing) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#F6F1E9"}}>
        <div className="text-center">
          <p className="text-4xl mb-4">🍽</p>
          <p className="font-dm-sans" style={{color:"#8A8480"}}>Listing not found</p>
          <Link href="/food" className="mt-4 inline-block text-sm font-dm-sans" style={{color:"#C4531A"}}>← Back to food</Link>
        </div>
      </div>
    </Layout>
  );

  const isOwner = user?.uid === listing.sellerId;
  const soldOut = listing.status === "sold_out";

  return (
    <>
      <Head>
        <title>{ogData?.title || listing.name} — Planet Mall Food</title>
        <meta name="description" content={ogData?.description || listing.description?.slice(0,150)} />
        <meta property="og:type"        content="product" />
        <meta property="og:site_name"   content="Planet Mall" />
        <meta property="og:title"       content={ogData?.title || `${listing.name} — ${listing.currency} ${listing.price?.toLocaleString()}`} />
        <meta property="og:description" content={ogData?.description || `📍 ${listing.city} · ${listing.description?.slice(0,120)}`} />
        <meta property="og:image"       content={ogData?.image || listing.images?.[0] || "https://planetmallshop.com/logo.jpg"} />
        <meta property="og:url"         content={ogData?.url || `https://planetmallshop.com/food/${listing.id}`} />
        <meta name="twitter:card"       content="summary_large_image" />
      </Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-5xl mx-auto pt-6">

            <div className="flex items-center gap-2 text-xs font-dm-sans mb-6" style={{color:"#8A8480"}}>
              <Link href="/food" className="hover:underline">Food</Link>
              <span>›</span>
              <span>{listing.category}</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left */}
              <div className="lg:col-span-2 space-y-5">
                <div className="rounded-2xl overflow-hidden" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <div className="h-72 sm:h-96 overflow-hidden" style={{background:"#F6F1E9"}}>
                    {listing.images?.[activeImg] ? (
                      <img src={listing.images[activeImg]} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">🍽</div>
                    )}
                  </div>
                  {listing.images?.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto">
                      {listing.images.map((img,i)=>(
                        <button key={i} onClick={()=>setActiveImg(i)}
                          className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all"
                          style={{borderColor: activeImg===i?"#C4531A":"transparent"}}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="font-syne font-bold text-2xl" style={{color:"#1A1714"}}>{listing.name}</h1>
                      <p className="text-sm font-dm-sans mt-1" style={{color:"#8A8480"}}>
                        📍 {listing.city}, {listing.province} · {timeAgo(listing.createdAt as any)} · 👁 {listing.views} views
                      </p>
                    </div>
                    {soldOut && (
                      <span className="px-3 py-1 rounded-full text-sm font-bold font-dm-sans bg-red-100 text-red-600">SOLD OUT</span>
                    )}
                  </div>

                  <div className="flex gap-3 flex-wrap mb-5">
                    <span className="px-3 py-1 rounded-full text-xs font-dm-sans font-medium" style={{background:"#F6F1E9",color:"#8A8480"}}>
                      {listing.category}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-dm-sans font-medium" style={{background:"#F6F1E9",color:"#8A8480"}}>
                      ⏱ {listing.prepTime}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-dm-sans font-semibold" style={{background:"rgba(42,107,69,0.1)",color:"#2A6B45"}}>
                      🔐 Escrow protected — instant payout
                    </span>
                  </div>

                  <p className="font-dm-sans text-sm leading-relaxed mb-4" style={{color:"#4A4440"}}>
                    {listing.description}
                  </p>

                  <div className="flex items-center gap-4 pt-4" style={{borderTop:"1px solid #E8E2D9"}}>
                    <ShareButton
                      url={typeof window !== "undefined" ? window.location.href : ""}
                      title={listing.name}
                      text={`Check out ${listing.name} on Planet Mall Food`}
                      variant="button"
                    />
                    <ReportButton type="product" targetId={listing.id!} targetName={listing.name} />
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-4">
                <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <p className="font-syne font-bold text-3xl mb-4" style={{color:"#C4531A"}}>
                    {listing.currency} {listing.price?.toLocaleString()}
                  </p>

                  {!isOwner && !soldOut && (
                    <>
                      <div className="flex items-center gap-3 mb-3 px-4 py-2 rounded-xl border" style={{borderColor:"#D4CFC6"}}>
                        <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{color:"#8A8480"}}>−</button>
                        <span className="font-syne font-bold flex-1 text-center" style={{color:"#1A1714"}}>{qty}</span>
                        <button onClick={()=>setQty(q=>q+1)} style={{color:"#8A8480"}}>+</button>
                      </div>
                      <button onClick={handleAddToCart}
                        className="w-full py-3.5 rounded-xl text-white font-dm-sans font-bold mb-3"
                        style={{background:"#C4531A"}}>
                        Add to cart — {listing.currency} {(listing.price*qty).toLocaleString()}
                      </button>
                      <button onClick={handleMessage} disabled={messaging}
                        className="w-full py-3 rounded-xl font-dm-sans font-semibold text-sm border disabled:opacity-50"
                        style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                        {messaging ? "Opening chat..." : "💬 Message seller"}
                      </button>
                    </>
                  )}

                  {isOwner && (
                    <div className="space-y-3">
                      <button onClick={() => router.push(`/food/post?edit=${listing.id}`)}
                        className="w-full py-3 rounded-xl font-dm-sans font-bold text-sm text-white"
                        style={{background:"#1A1714"}}>
                        ✏️ Edit listing
                      </button>
                      <button onClick={handleToggleSoldOut}
                        className="w-full py-3 rounded-xl font-dm-sans font-semibold text-sm border"
                        style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                        {soldOut ? "Mark as available" : "Mark as sold out"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <p className="text-xs font-dm-sans font-semibold uppercase tracking-wide mb-3" style={{color:"#8A8480"}}>Seller</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold"
                      style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
                      {listing.sellerPhoto
                        ? <img src={listing.sellerPhoto} alt="" className="w-full h-full object-cover" />
                        : listing.sellerName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-dm-sans font-semibold text-sm" style={{color:"#1A1714"}}>{listing.sellerName}</p>
                      <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Member of Planet Mall</p>
                    </div>
                  </div>
                </div>

                <BuyerProtectionBadge />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

export async function getServerSideProps({ params }: { params: { id: string } }) {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const snap = await adminDb.doc(`foodListings/${params.id}`).get();
    if (!snap.exists) return { props: {} };
    const data = snap.data()!;
    return {
      props: {
        ogData: {
          title:       `${data.name} — ${data.currency || "CAD"} ${Number(data.price || 0).toLocaleString()}`,
          description: `📍 ${data.city} · ${(data.description || "").slice(0, 140)}`,
          image:       data.images?.[0] || "https://planetmallshop.com/logo.jpg",
          url:         `https://planetmallshop.com/food/${params.id}`,
        },
      },
    };
  } catch {
    return { props: {} };
  }
}
