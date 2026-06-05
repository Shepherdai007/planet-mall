// pages/classifieds/[id].tsx
// ─── CLASSIFIED LISTING DETAIL PAGE ─────────────────────────────

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useEffect, useState } from "react";
import Layout         from "@/components/Layout";
import { useAuth }    from "@/context/AuthContext";
import { getClassified, markAsSold } from "@/services/classifiedService";
import { formatCurrency, timeAgo }   from "@/lib/helpers";
import { getOrCreateConversation }   from "@/services/messageService";
import ReportButton   from "@/components/ReportButton";
import ShareButton    from "@/components/ShareButton";
import BuyerProtectionBadge from "@/components/BuyerProtectionBadge";
import toast          from "react-hot-toast";
import type { Classified } from "@/services/classifiedService";

const CONDITION_LABELS: Record<string,string> = {
  new:"New", like_new:"Like New", good:"Good",
  fair:"Fair", parts_only:"Parts Only", na:"N/A",
};

export default function ClassifiedDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, userDoc } = useAuth();
  const [listing,   setListing]   = useState<Classified|null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [messaging, setMessaging] = useState(false);
  const [boosting,  setBoosting]  = useState(false);

  useEffect(() => {
    if (!id) return;
    getClassified(id as string).then(l => { setListing(l); setLoading(false); });
  }, [id]);

  async function handleMessage() {
    if (!user || !listing) { router.push("/auth/login"); return; }
    setMessaging(true);
    try {
      const convId = await getOrCreateConversation(
        user.uid, userDoc?.displayName || "", userDoc?.photoURL || "",
        listing.sellerId, listing.sellerName, listing.sellerPhoto,
        listing.id!, listing.title, listing.images?.[0] || ""
      );
      router.push(`/messages/${convId}`);
    } catch { toast.error("Failed to open chat"); }
    finally { setMessaging(false); }
  }

  async function handleBoost() {
    if (!user || !listing) return;
    setBoosting(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          plan: "boost_listing",
          userId: user.uid,
          email: user.email,
          listingId: listing.id,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { toast.error("Failed to start boost"); }
    finally { setBoosting(false); }
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
          <p className="text-4xl mb-4">📋</p>
          <p className="font-dm-sans" style={{color:"#8A8480"}}>Listing not found</p>
          <Link href="/classifieds" className="mt-4 inline-block text-sm font-dm-sans" style={{color:"#C4531A"}}>← Back to classifieds</Link>
        </div>
      </div>
    </Layout>
  );

  const isOwner = user?.uid === listing.sellerId;

  return (
    <>
      <Head><title>{listing.title} — Planet Mall Classifieds</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-5xl mx-auto pt-6">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-dm-sans mb-6" style={{color:"#8A8480"}}>
              <Link href="/classifieds" className="hover:underline">Classifieds</Link>
              <span>›</span>
              <span>{listing.category}</span>
              <span>›</span>
              <span className="truncate max-w-xs">{listing.title}</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left — images + details */}
              <div className="lg:col-span-2 space-y-5">

                {/* Images */}
                <div className="rounded-2xl overflow-hidden" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <div className="h-72 sm:h-96 overflow-hidden" style={{background:"#F6F1E9"}}>
                    {listing.images?.[activeImg] ? (
                      <img src={listing.images[activeImg]} alt={listing.title} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">📋</div>
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

                {/* Details */}
                <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {listing.featured && (
                        <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-dm-sans"
                          style={{background:"rgba(212,168,75,0.15)",color:"#D4A84B"}}>⭐ Featured</span>
                      )}
                      <h1 className="font-syne font-bold text-2xl" style={{color:"#1A1714"}}>{listing.title}</h1>
                      <p className="text-sm font-dm-sans mt-1" style={{color:"#8A8480"}}>
                        📍 {listing.city}, {listing.province} · {timeAgo(listing.createdAt as any)} · 👁 {listing.views} views
                      </p>
                    </div>
                    {listing.status === "sold" && (
                      <span className="px-3 py-1 rounded-full text-sm font-bold font-dm-sans bg-red-100 text-red-600">SOLD</span>
                    )}
                  </div>

                  <div className="flex gap-3 flex-wrap mb-5">
                    <span className="px-3 py-1 rounded-full text-xs font-dm-sans font-medium"
                      style={{background:"#F6F1E9",color:"#8A8480"}}>{listing.category}</span>
                    {listing.condition !== "na" && (
                      <span className="px-3 py-1 rounded-full text-xs font-dm-sans font-medium"
                        style={{background:"#F6F1E9",color:"#8A8480"}}>
                        {CONDITION_LABELS[listing.condition]}
                      </span>
                    )}
                    {listing.useEscrow && (
                      <span className="px-3 py-1 rounded-full text-xs font-dm-sans font-semibold"
                        style={{background:"rgba(42,107,69,0.1)",color:"#2A6B45"}}>
                        🔐 Escrow available
                      </span>
                    )}
                  </div>

                  <p className="font-dm-sans text-sm leading-relaxed mb-4" style={{color:"#4A4440"}}>
                    {listing.description}
                  </p>

                  <div className="flex items-center gap-4 pt-4" style={{borderTop:"1px solid #E8E2D9"}}>
                    <ShareButton
                      url={typeof window !== "undefined" ? window.location.href : ""}
                      title={listing.title}
                      text={`Check out this listing on Planet Mall: ${listing.title}`}
                      variant="button"
                    />
                    <ReportButton type="product" targetId={listing.id!} targetName={listing.title} />
                  </div>
                </div>
              </div>

              {/* Right — price + contact */}
              <div className="space-y-4">

                {/* Price card */}
                <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <p className="font-syne font-bold text-3xl mb-1" style={{color:"#C4531A"}}>
                    {listing.priceType === "free" ? "FREE"
                      : listing.priceType === "contact" ? "Contact for price"
                      : `${formatCurrency(listing.price,"CAD")}${listing.priceType==="negotiable"?" (OBO)":""}`}
                  </p>
                  <p className="text-xs font-dm-sans mb-5" style={{color:"#8A8480"}}>
                    {listing.priceType === "negotiable" ? "Price is negotiable" : ""}
                  </p>

                  {!isOwner && listing.status !== "sold" && (
                    <button onClick={handleMessage} disabled={messaging}
                      className="w-full py-3.5 rounded-xl text-white font-dm-sans font-bold mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{background:"#C4531A"}}>
                      {messaging
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Opening chat...</>
                        : "💬 Message seller"}
                    </button>
                  )}

                  {isOwner && (
                    <div className="space-y-3">
                      <button onClick={()=>markAsSold(listing.id!).then(()=>toast.success("Marked as sold!"))}
                        className="w-full py-3 rounded-xl font-dm-sans font-semibold text-sm border"
                        style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                        Mark as sold
                      </button>
                      {!listing.featured && (
                        <button onClick={handleBoost} disabled={boosting}
                          className="w-full py-3 rounded-xl font-dm-sans font-bold text-sm text-white flex items-center justify-center gap-2"
                          style={{background:"linear-gradient(135deg,#D4A84B,#C4531A)"}}>
                          {boosting
                            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Loading...</>
                            : "⭐ Boost for CA$2.99"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Seller info */}
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

                {/* Escrow info */}
                {listing.useEscrow && (
                  <BuyerProtectionBadge />
                )}

                {/* Safety tips */}
                <div className="p-4 rounded-2xl" style={{background:"#FFF8F0",border:"1px solid #F0E0C8"}}>
                  <p className="font-dm-sans font-semibold text-xs mb-2" style={{color:"#C4531A"}}>⚠️ Safety tips</p>
                  <ul className="space-y-1">
                    {[
                      "Meet in a public place",
                      "Never send payment before seeing the item",
                      "Use Planet Mall escrow for protection",
                      "Trust your instincts",
                    ].map(tip=>(
                      <li key={tip} className="text-xs font-dm-sans flex gap-1.5" style={{color:"#8A8480"}}>
                        <span>•</span>{tip}
                      </li>
                    ))}
                  </ul>
                  <Link href="/trust" className="text-xs font-dm-sans font-semibold mt-2 inline-block" style={{color:"#C4531A"}}>
                    Trust & Safety →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
