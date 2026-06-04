// components/ReviewSection.tsx
// ─── PRODUCT REVIEWS SECTION ────────────────────────────────────
// Shows reviews + allows logged-in buyers to add a review.
// Used on product detail page.

"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getProductReviews, createReview, markHelpful,
} from "@/services/reviewService";
import { timeAgo } from "@/lib/helpers";
import type { Review } from "@/services/reviewService";
import toast from "react-hot-toast";

interface Props {
  productId: string;
  shopId:    string;
}

export default function ReviewSection({ productId, shopId }: Props) {
  const { user, userDoc } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating,   setRating]  = useState(5);
  const [title,    setTitle]   = useState("");
  const [body,     setBody]    = useState("");
  const [saving,   setSaving]  = useState(false);

  useEffect(() => {
    getProductReviews(productId).then(r => { setReviews(r); setLoading(false); });
  }, [productId]);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !userDoc) return;
    setSaving(true);
    try {
      await createReview({
        productId, shopId,
        authorId:    user.uid,
        authorName:  userDoc.displayName,
        authorPhoto: userDoc.photoURL || "",
        rating, title, body,
        verified: false,
      });
      const updated = await getProductReviews(productId);
      setReviews(updated);
      setShowForm(false);
      setTitle(""); setBody(""); setRating(5);
      toast.success("Review posted!");
    } catch {
      toast.error("Failed to post review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-16 pt-10" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-syne font-bold text-2xl text-paper mb-1">Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <Stars rating={avgRating} />
              <span className="text-sm text-muted font-dm-sans">
                {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        {user && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl text-sm font-dm-sans font-medium border border-white/10 text-paper hover:bg-white/5 transition-all">
            Write a review
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="p-6 rounded-2xl mb-8 animate-fade-in"
          style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)"}}>
          <h3 className="font-syne font-bold text-lg text-paper mb-5">Your review</h3>

          {/* Star rating */}
          <div className="flex gap-2 mb-5">
            {[1,2,3,4,5].map(s => (
              <button key={s} type="button" onClick={() => setRating(s)}
                className="text-2xl transition-all hover:scale-110">
                <span style={{color: s <= rating ? "#D4A84B" : "rgba(255,255,255,0.2)"}}>★</span>
              </button>
            ))}
            <span className="text-sm text-muted font-dm-sans ml-2 self-center">
              {["","Terrible","Poor","OK","Good","Excellent"][rating]}
            </span>
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="Review title"
            className="w-full px-4 py-3 rounded-xl border text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none mb-3"
            style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)"}}
            onFocus={e => e.target.style.borderColor="rgba(196,83,26,0.5)"}
            onBlur={e  => e.target.style.borderColor="rgba(255,255,255,0.1)"} />

          <textarea value={body} onChange={e => setBody(e.target.value)} required rows={4}
            placeholder="Share your experience with this product..."
            className="w-full px-4 py-3 rounded-xl border text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none resize-none mb-4"
            style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)"}}
            onFocus={e => e.target.style.borderColor="rgba(196,83,26,0.5)"}
            onBlur={e  => e.target.style.borderColor="rgba(255,255,255,0.1)"} />

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-dm-sans font-semibold disabled:opacity-50 flex items-center gap-2"
              style={{background:"#C4531A"}}>
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting...</> : "Post review"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-dm-sans border border-white/10 text-muted hover:text-paper transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-3xl mb-3">⭐</p>
          <p className="text-sm text-muted font-dm-sans">No reviews yet — be the first!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="pb-6" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{background:"rgba(255,255,255,0.08)"}}>
                  {review.authorPhoto
                    ? <img src={review.authorPhoto} alt="" className="w-full h-full object-cover" />
                    : <span className="text-sm font-bold text-paper">{review.authorName?.[0]}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-dm-sans font-semibold text-paper">{review.authorName}</p>
                    {review.verified && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-dm-sans font-semibold"
                        style={{background:"rgba(42,107,69,0.15)",color:"#2A6B45"}}>
                        ✓ Verified purchase
                      </span>
                    )}
                    <span className="text-xs text-muted font-dm-sans">{timeAgo(review.createdAt as any)}</span>
                  </div>
                  <Stars rating={review.rating} small />
                </div>
              </div>
              <p className="font-dm-sans font-semibold text-sm text-paper mb-1">{review.title}</p>
              <p className="text-sm text-muted font-dm-sans leading-relaxed mb-3">{review.body}</p>
              <button onClick={() => markHelpful(review.id!, review.helpful)}
                className="text-xs text-muted font-dm-sans hover:text-paper transition-colors">
                👍 Helpful ({review.helpful})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stars({ rating, small = false }: { rating: number; small?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={small ? "text-sm" : "text-base"}
          style={{color: s <= Math.round(rating) ? "#D4A84B" : "rgba(255,255,255,0.2)"}}>★</span>
      ))}
    </div>
  );
}
