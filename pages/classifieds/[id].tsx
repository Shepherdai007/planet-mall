// pages/classifieds/[id].tsx
// ─── CLASSIFIED LISTING DETAIL PAGE ─────────────────────────────

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useEffect, useState } from "react";
import Layout         from "@/components/Layout";
import { useAuth }    from "@/context/AuthContext";
import { getClassified, getClassifieds, markAsSold } from "@/services/classifiedService";
import { saveListing, unsaveListing, listenSavedIds } from "@/services/favoritesService";
import { getSellerRatingSummary, getSellerReviews, submitSellerRating, hasUserRatedSeller } from "@/services/sellerRatingService";
import { formatCurrency, timeAgo }   from "@/lib/helpers";
import { getOrCreateConversation }   from "@/services/messageService";
import ReportButton   from "@/components/ReportButton";
import ShareButton    from "@/components/ShareButton";
import ContactSellerCard from "@/components/ContactSellerCard";
import BuyerProtectionBadge from "@/components/BuyerProtectionBadge";
import toast          from "react-hot-toast";
import type { Classified } from "@/services/classifiedService";

const CONDITION_LABELS: Record<string,string> = {
  new:"New", like_new:"Like New", good:"Good",
  fair:"Fair", parts_only:"Parts Only", na:"N/A",
};

export default function ClassifiedDetailPage({ ogData }: { ogData?: any }) {
  const router = useRouter();
  const { id } = router.query;
  const { user, userDoc } = useAuth();
  const [listing,   setListing]   = useState<Classified|null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [messaging, setMessaging] = useState(false);
  const [boosting,  setBoosting]  = useState(false);
  const [showMore,  setShowMore]  = useState(false);
  const [similar,   setSimilar]   = useState<Classified[]>([]);
  const [scrolled,  setScrolled]  = useState(false);
  const [isSaved,   setIsSaved]   = useState(false);
  const [saving,    setSavingFav] = useState(false);
  const [ratingSum, setRatingSum] = useState<{average:number,count:number}|null>(null);
  const [reviews,   setReviews]   = useState<any[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [myRating,  setMyRating]  = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    if (!id) return;
    getClassified(id as string).then(l => {
      setListing(l);
      setLoading(false);
      if (l?.category) {
        getClassifieds({ category: l.category, limit: 5 })
          .then(results => setSimilar(results.filter(r => r.id !== id)))
          .catch(() => {});
      }
      if (l?.sellerId) {
        getSellerRatingSummary(l.sellerId).then(setRatingSum).catch(() => {});
        getSellerReviews(l.sellerId).then(setReviews).catch(() => {});
      }
    }).catch(err => {
      console.error("Failed to load classified:", err);
      setListing(null);
      setLoading(false);
    });
  }, [id]);

  // Listen to saved IDs
  useEffect(() => {
    if (!user) return;
    const unsub = listenSavedIds(user.uid, ids => setIsSaved(ids.has(id as string)));
    return unsub;
  }, [user, id]);

  // Check if already rated
  useEffect(() => {
    if (!user || !listing) return;
    hasUserRatedSeller(listing.sellerId, user.uid).then(setAlreadyRated);
  }, [user, listing]);

  // Scroll listener for sticky bar
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 300); }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSaveListing() {
    if (!user) { router.push("/auth/login"); return; }
    if (!listing) return;
    setSavingFav(true);
    try {
      if (isSaved) {
        await unsaveListing(user.uid, listing.id!);
        toast.success("Removed from saved");
      } else {
        await saveListing(user.uid, {
          id: listing.id!, title: listing.title,
          image: listing.images?.[0] || "",
          price: listing.price, priceType: listing.priceType,
          currency: listing.currency || "CAD",
          city: listing.city, category: listing.category,
        });
        toast.success("Saved! ❤️");
      }
    } catch { toast.error("Failed to save"); }
    finally { setSavingFav(false); }
  }

  async function handleSubmitRating() {
    if (!user || !listing || myRating === 0) return;
    setSubmittingRating(true);
    try {
      await submitSellerRating(listing.sellerId, {
        reviewerId: user.uid,
        reviewerName: userDoc?.displayName || "Anonymous",
        reviewerPhoto: userDoc?.photoURL || "",
        rating: myRating,
        comment: myComment,
      });
      toast.success("Rating submitted! ⭐");
      setShowRatingModal(false);
      setAlreadyRated(true);
      getSellerRatingSummary(listing.sellerId).then(setRatingSum);
      getSellerReviews(listing.sellerId).then(setReviews);
    } catch { toast.error("Failed to submit rating"); }
    finally { setSubmittingRating(false); }
  }

  async function handleMessage() {
    if (!user || !listing) { router.push("/auth/login"); return; }
    setMessaging(true);
    try {
      const convId = await getOrCreateConversation(
        user.uid, userDoc?.displayName || user.displayName || "", userDoc?.photoURL || "",
        listing.sellerId, listing.sellerName, listing.sellerPhoto,
        listing.id!, listing.title, listing.images?.[0] || "",
        listing.id!,   // listingId — one chat per listing
        listing.title  // listingTitle
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
      <Head>
        <title>{ogData?.title || listing.title} — Planet Mall Classifieds</title>
        <meta name="description" content={ogData?.description || listing.description?.slice(0,150)} />

        {/* Open Graph — WhatsApp, Facebook, Telegram */}
        <meta property="og:type"         content="product" />
        <meta property="og:site_name"    content="Planet Mall" />
        <meta property="og:title"        content={ogData?.title || `${listing.title} — ${listing.currency || "CAD"} ${listing.price?.toLocaleString()}`} />
        <meta property="og:description"  content={ogData?.description || `📍 ${listing.city} · ${listing.description?.slice(0,120)}`} />
        <meta property="og:image"        content={ogData?.image || listing.images?.[0] || "https://planetmallshop.com/logo.jpg"} />
        <meta property="og:image:width"  content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url"          content={ogData?.url || `https://planetmallshop.com/classifieds/${listing.id}`} />

        {/* Twitter / X */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={ogData?.title || listing.title} />
        <meta name="twitter:description" content={ogData?.description || `📍 ${listing.city}`} />
        <meta name="twitter:image"       content={ogData?.image || listing.images?.[0] || "https://planetmallshop.com/logo.jpg"} />
      </Head>
      <Layout>
        {/* Sticky bar — shows when scrolled down */}
        {scrolled && (
          <div className="fixed top-16 left-0 right-0 z-40 px-4 py-3 flex items-center gap-4 shadow-lg"
            style={{background:"#fff",borderBottom:"1px solid #E8E2D9"}}>
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{background:"#F6F1E9"}}>
              {listing.images?.[0]
                ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-lg">📋</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-dm-sans font-semibold text-sm truncate" style={{color:"#1A1714"}}>{listing.title}</p>
              <p className="font-syne font-bold text-sm" style={{color:"#C4531A"}}>
                {listing.priceType === "free" ? "FREE"
                  : listing.priceType === "contact" ? "Contact for price"
                  : `${listing.currency || "CAD"} ${listing.price?.toLocaleString()}${listing.priceType === "negotiable" ? " (OBO)" : ""}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isOwner && listing.status !== "sold" && (
                <button onClick={handleMessage} disabled={messaging}
                  className="px-4 py-2 rounded-xl text-white font-dm-sans font-bold text-sm disabled:opacity-50"
                  style={{background:"#C4531A"}}>
                  💬 Message
                </button>
              )}
            </div>
          </div>
        )}
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
                    <div className="flex-1 min-w-0">
                      {listing.featured && (
                        <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-dm-sans"
                          style={{background:"rgba(212,168,75,0.15)",color:"#D4A84B"}}>⭐ Featured</span>
                      )}
                      <h1 className="font-syne font-bold text-2xl" style={{color:"#1A1714"}}>{listing.title}</h1>
                      <p className="text-sm font-dm-sans mt-1" style={{color:"#8A8480"}}>
                        📍 {listing.city}, {listing.province} · {timeAgo(listing.createdAt as any)} · 👁 {listing.views} views
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {/* Heart / Save button */}
                      {!isOwner && (
                        <button onClick={handleSaveListing} disabled={saving}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                          style={{background: isSaved ? "rgba(196,83,26,0.1)" : "#F6F1E9",border:"1px solid #E8E2D9"}}>
                          <span className="text-lg">{isSaved ? "❤️" : "🤍"}</span>
                        </button>
                      )}
                      {listing.status === "sold" && (
                        <span className="px-3 py-1 rounded-full text-sm font-bold font-dm-sans bg-red-100 text-red-600">SOLD</span>
                      )}
                    </div>
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

                  <div className="mb-4">
                    <p className="font-dm-sans text-sm leading-relaxed" style={{color:"#4A4440"}}>
                      {showMore || (listing.description?.length || 0) <= 200
                        ? listing.description
                        : listing.description?.slice(0, 200) + "..."}
                    </p>
                    {(listing.description?.length || 0) > 200 && (
                      <button onClick={() => setShowMore(v => !v)}
                        className="mt-2 text-sm font-dm-sans font-semibold"
                        style={{color:"#C4531A"}}>
                        {showMore ? "Show less ↑" : "Show more ↓"}
                      </button>
                    )}
                  </div>

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
                      : `${listing.currency || "CAD"} ${listing.price?.toLocaleString()}${listing.priceType==="negotiable"?" (OBO)":""}`}
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

                  {!isOwner && listing.status !== "sold" && (
                    <ContactSellerCard phone={listing.phone} whatsapp={listing.whatsapp} />
                  )}

                  {isOwner && (
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(`/classifieds/post?edit=${listing.id}`)}
                        className="w-full py-3 rounded-xl font-dm-sans font-bold text-sm text-white flex items-center justify-center gap-2"
                        style={{background:"#1A1714",border:"1px solid rgba(255,255,255,0.1)"}}>
                        ✏️ Edit listing
                      </button>
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
                            : "⭐ Boost for CA$0.99"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Seller info */}
                <div className="p-5 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <p className="text-xs font-dm-sans font-semibold uppercase tracking-wide mb-3" style={{color:"#8A8480"}}>Seller</p>
                  <div className="flex items-center gap-3 mb-3">
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

                  {/* Star rating summary */}
                  {ratingSum && ratingSum.count > 0 ? (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className="text-sm">{s <= Math.round(ratingSum.average) ? "⭐" : "☆"}</span>
                        ))}
                      </div>
                      <span className="text-xs font-dm-sans font-semibold" style={{color:"#1A1714"}}>{ratingSum.average}</span>
                      <span className="text-xs font-dm-sans" style={{color:"#8A8480"}}>({ratingSum.count} review{ratingSum.count !== 1 ? "s" : ""})</span>
                    </div>
                  ) : (
                    <p className="text-xs font-dm-sans mb-3" style={{color:"#8A8480"}}>No reviews yet</p>
                  )}

                  {/* Rate seller button */}
                  {!isOwner && user && !alreadyRated && (
                    <button onClick={() => setShowRatingModal(true)}
                      className="w-full py-2 rounded-xl text-xs font-dm-sans font-semibold border transition-all"
                      style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                      ⭐ Rate this seller
                    </button>
                  )}
                  {alreadyRated && (
                    <p className="text-xs font-dm-sans text-center" style={{color:"#2A6B45"}}>✓ You rated this seller</p>
                  )}
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

            {/* Similar listings */}
            {similar.length > 0 && (
              <div className="mt-10">
                <h2 className="font-syne font-bold text-xl mb-5" style={{color:"#1A1714"}}>Similar listings</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {similar.slice(0,4).map(item => (
                    <Link key={item.id} href={`/classifieds/${item.id}`}
                      className="rounded-2xl overflow-hidden block transition-all hover:shadow-md group"
                      style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                      <div className="h-32 overflow-hidden" style={{background:"#F6F1E9"}}>
                        {item.images?.[0]
                          ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-3xl">📋</div>}
                      </div>
                      <div className="p-3">
                        <p className="font-dm-sans font-semibold text-xs mb-1 line-clamp-2" style={{color:"#1A1714"}}>{item.title}</p>
                        <p className="font-syne font-bold text-sm" style={{color:"#C4531A"}}>
                          {item.priceType === "free" ? "FREE"
                            : item.priceType === "contact" ? "Contact"
                            : `${item.currency || "CAD"} ${item.price?.toLocaleString()}`}
                        </p>
                        <p className="text-[10px] font-dm-sans mt-1 truncate" style={{color:"#8A8480"}}>📍 {item.city}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </Layout>

        {/* Rating modal */}
        {showRatingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{background:"rgba(0,0,0,0.5)"}}>
            <div className="w-full max-w-sm rounded-2xl p-6" style={{background:"#fff"}}>
              <h3 className="font-syne font-bold text-lg mb-1" style={{color:"#1A1714"}}>Rate {listing.sellerName}</h3>
              <p className="text-xs font-dm-sans mb-5" style={{color:"#8A8480"}}>How was your experience with this seller?</p>
              <div className="flex gap-2 justify-center mb-5">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setMyRating(s)} className="text-3xl transition-transform hover:scale-110">
                    {s <= myRating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                placeholder="Share your experience (optional)..." rows={3}
                className="w-full px-4 py-3 rounded-xl border text-sm font-dm-sans resize-none focus:outline-none mb-4"
                style={{borderColor:"#E8E2D9",color:"#1A1714"}}
                onFocus={e => e.target.style.borderColor="#C4531A"}
                onBlur={e => e.target.style.borderColor="#E8E2D9"} />
              <div className="flex gap-3">
                <button onClick={() => setShowRatingModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-dm-sans border"
                  style={{borderColor:"#E8E2D9",color:"#8A8480"}}>Cancel</button>
                <button onClick={handleSubmitRating} disabled={myRating === 0 || submittingRating}
                  className="flex-1 py-3 rounded-xl text-sm font-dm-sans font-bold text-white disabled:opacity-50"
                  style={{background:"#C4531A"}}>
                  {submittingRating ? "Submitting..." : "Submit rating"}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

export async function getServerSideProps({ params }: { params: { id: string } }) {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const snap = await adminDb.doc(`classifieds/${params.id}`).get();
    if (!snap.exists) return { props: {} };

    const data = snap.data()!;
    const priceLabel = data.priceType === "free" ? "FREE"
      : data.priceType === "contact" ? "Contact for price"
      : `${data.currency || "CAD"} ${Number(data.price || 0).toLocaleString()}`;

    return {
      props: {
        ogData: {
          title:       `${data.title} — ${priceLabel}`,
          description: `📍 ${data.city}, ${data.province} · ${(data.description || "").slice(0, 140)}`,
          image:       data.images?.[0] || "https://planetmallshop.com/logo.jpg",
          url:         `https://planetmallshop.com/classifieds/${params.id}`,
        },
      },
    };
  } catch {
    return { props: {} };
  }
}
