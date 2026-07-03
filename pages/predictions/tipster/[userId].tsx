// pages/predictions/tipster/[userId].tsx
// ─── TIPSTER PUBLIC PROFILE PAGE ─────────────────────────────────
// Shows tipster bio, win rate, social links, all their predictions
// and VIP picks. Includes follow button and share.

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useState, useEffect } from "react";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import {
  getTipsterProfile, getPredictions, getVIPPicks,
  followTipster, unfollowTipster, isFollowingTipster,
  updatePredictionResult, likePrediction,
} from "@/services/predictionService";
import { getTeamDisplay, getLeagueFlag } from "@/lib/countryFlags";
import { timeAgo }     from "@/lib/helpers";
import toast           from "react-hot-toast";
import type { Tipster, Prediction, VIPPick } from "@/services/predictionService";

const RESULT_COLORS: Record<string, string> = {
  pending: "#8A8480", won: "#2A6B45", lost: "#C4531A", void: "#8A8480",
};
const RESULT_LABELS: Record<string, string> = {
  pending: "⏳ Pending", won: "✅ Won", lost: "❌ Lost", void: "🔄 Void",
};

export default function TipsterProfilePage() {
  const router = useRouter();
  const { userId } = router.query;
  const { user, isLoggedIn } = useAuth();

  const [tipster,     setTipster]     = useState<Tipster | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [vipPicks,    setVipPicks]    = useState<VIPPick[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [following,   setFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [tab,         setTab]         = useState<"tips"|"vip">("tips");
  const [likedIds,    setLikedIds]    = useState<Set<string>>(new Set());
  const [lightboxImg, setLightboxImg] = useState<string>("");

  const isOwner = user?.uid === userId;

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      getTipsterProfile(userId as string),
      getPredictions({ tipsterId: userId as string, limit: 50 }),
      getVIPPicks({ tipsterId: userId as string }),
    ]).then(([t, preds, vips]) => {
      setTipster(t);
      setPredictions(preds);
      setVipPicks(vips);
      setLoading(false);
    });

    if (user && !isOwner) {
      isFollowingTipster(userId as string, user.uid).then(setFollowing);
    }
  }, [userId, user]);

  async function handleFollow() {
    if (!isLoggedIn) { toast.error("Sign in to follow"); return; }
    if (!tipster) return;
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowTipster(tipster.userId, user!.uid);
        setFollowing(false);
        setTipster(t => t ? { ...t, followers: t.followers - 1 } : t);
        toast.success("Unfollowed");
      } else {
        await followTipster(tipster.userId, user!.uid);
        setFollowing(true);
        setTipster(t => t ? { ...t, followers: t.followers + 1 } : t);
        toast.success(`Following ${tipster.name}! 🎉`);
      }
    } catch { toast.error("Failed"); }
    finally { setFollowLoading(false); }
  }

  async function handleUpdateResult(predId: string, result: Prediction["result"]) {
    await updatePredictionResult(predId, result);
    setPredictions(prev => prev.map(p => p.id === predId ? { ...p, result } : p));
    toast.success("Result updated!");
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: tipster?.name || "Tipster", url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  }

  async function handleLike(predId: string) {
    if (!isLoggedIn) { toast.error("Sign in to like"); return; }
    if (likedIds.has(predId)) return;
    setLikedIds(prev => new Set(prev).add(predId));
    setPredictions(prev => prev.map(p => p.id === predId ? { ...p, likes: p.likes + 1 } : p));
    await likePrediction(predId);
  }

  const winRate = tipster && tipster.totalPicks > 0
    ? Math.round((tipster.winCount / tipster.totalPicks) * 100)
    : 0;

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#0A0908"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    </Layout>
  );

  if (!tipster) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center text-center px-4" style={{background:"#0A0908"}}>
        <div>
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-dm-sans text-muted mb-4">Tipster not found</p>
          <Link href="/predictions" className="text-sm font-dm-sans" style={{color:"#C4531A"}}>← Back to predictions</Link>
        </div>
      </div>
    </Layout>
  );

  return (
    <>
      <Head>
        <title>{tipster.name} — Planet Mall Predictions</title>
        <meta name="description" content={tipster.bio} />
      </Head>
      <Layout>
        <div className="min-h-screen pb-20" style={{background:"#0A0908"}}>

          {/* Profile header */}
          <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
            <Link href="/predictions" className="inline-flex items-center gap-1 text-sm font-dm-sans mb-6 block" style={{color:"#8A8480"}}>
              ← Back to predictions
            </Link>

            <div className="p-6 rounded-2xl mb-4" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-2xl"
                  style={{background:"rgba(196,83,26,0.2)",color:"#C4531A"}}>
                  {tipster.photo ? <img src={tipster.photo} alt="" className="w-full h-full object-cover" /> : tipster.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="font-syne font-bold text-xl text-paper">{tipster.name}</h1>
                    {tipster.verified && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:"rgba(42,107,69,0.2)",color:"#2A6B45"}}>✓ Verified</span>
                    )}
                  </div>
                  {tipster.bio && <p className="text-sm font-dm-sans mb-2" style={{color:"#8A8480"}}>{tipster.bio}</p>}

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-center">
                      <p className="font-syne font-bold text-lg" style={{color: winRate >= 60 ? "#2A6B45" : winRate >= 40 ? "#D4A84B" : "#C4531A"}}>{winRate}%</p>
                      <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>Win rate</p>
                    </div>
                    <div className="text-center">
                      <p className="font-syne font-bold text-lg text-paper">{tipster.totalPicks}</p>
                      <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>Picks</p>
                    </div>
                    <div className="text-center">
                      <p className="font-syne font-bold text-lg text-paper">{tipster.winCount}</p>
                      <p className="text-[10px] font-dm-sans" style={{color:"#2A6B45"}}>Won</p>
                    </div>
                    <div className="text-center">
                      <p className="font-syne font-bold text-lg text-paper">{tipster.lossCount}</p>
                      <p className="text-[10px] font-dm-sans" style={{color:"#C4531A"}}>Lost</p>
                    </div>
                    <div className="text-center">
                      <p className="font-syne font-bold text-lg text-paper">{tipster.followers}</p>
                      <p className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>Followers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="flex gap-2 flex-wrap mb-4">
                {tipster.telegram  && <a href={tipster.telegram}  target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-semibold" style={{background:"rgba(0,136,204,0.15)",color:"#0088cc"}}>✈️ Telegram</a>}
                {tipster.whatsapp  && <a href={`https://wa.me/${tipster.whatsapp.replace(/[^\d]/g,"")}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-semibold" style={{background:"rgba(37,211,102,0.15)",color:"#25D366"}}>💬 WhatsApp</a>}
                {tipster.twitter   && <a href={`https://twitter.com/${tipster.twitter.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-semibold" style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>🐦 Twitter/X</a>}
                {tipster.instagram && <a href={`https://instagram.com/${tipster.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-semibold" style={{background:"rgba(225,48,108,0.15)",color:"#E1306C"}}>📸 Instagram</a>}
                {tipster.youtube   && <a href={tipster.youtube}   target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-semibold" style={{background:"rgba(255,0,0,0.15)",color:"#FF0000"}}>▶️ YouTube</a>}
                {tipster.facebook  && <a href={tipster.facebook}  target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-semibold" style={{background:"rgba(24,119,242,0.15)",color:"#1877F2"}}>📘 Facebook</a>}
                {tipster.threads   && <a href={`https://threads.net/${tipster.threads.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-xs font-dm-sans font-semibold" style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>🧵 Threads</a>}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {!isOwner && (
                  <button onClick={handleFollow} disabled={followLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-dm-sans font-bold transition-all disabled:opacity-50"
                    style={{
                      background: following ? "rgba(255,255,255,0.06)" : "#C4531A",
                      color: following ? "#8A8480" : "#fff",
                      border: following ? "1px solid rgba(255,255,255,0.1)" : "none",
                    }}>
                    {followLoading ? "..." : following ? "✓ Following" : "+ Follow"}
                  </button>
                )}
                <button onClick={handleShare}
                  className="px-4 py-2.5 rounded-xl text-sm font-dm-sans font-semibold border"
                  style={{borderColor:"rgba(255,255,255,0.1)",color:"#8A8480"}}>
                  📤 Share
                </button>
                {isOwner && (
                  <Link href="/predictions/profile"
                    className="flex-1 py-2.5 rounded-xl text-sm font-dm-sans font-bold text-center border"
                    style={{borderColor:"rgba(255,255,255,0.1)",color:"#8A8480"}}>
                    ✏️ Edit profile
                  </Link>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              <button onClick={()=>setTab("tips")}
                className="px-4 py-2 rounded-xl text-sm font-dm-sans font-medium transition-all"
                style={{background: tab==="tips" ? "#C4531A" : "rgba(255,255,255,0.04)", color: tab==="tips" ? "#fff" : "#8A8480", border: `1px solid ${tab==="tips" ? "#C4531A" : "rgba(255,255,255,0.08)"}`}}>
                Free Tips ({predictions.length})
              </button>
              <button onClick={()=>setTab("vip")}
                className="px-4 py-2 rounded-xl text-sm font-dm-sans font-medium transition-all"
                style={{background: tab==="vip" ? "#D4A84B" : "rgba(255,255,255,0.04)", color: tab==="vip" ? "#000" : "#8A8480", border: `1px solid ${tab==="vip" ? "#D4A84B" : "rgba(255,255,255,0.08)"}`}}>
                ⭐ VIP Picks ({vipPicks.length})
              </button>
              {isOwner && (
                <Link href="/predictions/post"
                  className="px-4 py-2 rounded-xl text-sm font-dm-sans font-medium"
                  style={{background:"rgba(196,83,26,0.1)",color:"#C4531A",border:"1px solid rgba(196,83,26,0.2)"}}>
                  + Post tip
                </Link>
              )}
            </div>

            {/* Free tips */}
            {tab === "tips" && (
              <div className="space-y-3">
                {predictions.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted font-dm-sans">No predictions posted yet</p>
                  </div>
                ) : predictions.map(p => (
                  <div key={p.id} className="rounded-2xl overflow-hidden relative"
                    style={{
                      background:"rgba(255,255,255,0.03)",
                      border:`1px solid ${
                        p.result === "won"  ? "rgba(42,107,69,0.4)"   :
                        p.result === "lost" ? "rgba(196,83,26,0.4)"   :
                        p.result === "void" ? "rgba(138,132,128,0.3)" :
                        "rgba(255,255,255,0.06)"
                      }`,
                    }}>

                    {/* Result color bar at top */}
                    {p.result !== "pending" && (
                      <div className="h-1 w-full" style={{
                        background:
                          p.result === "won"  ? "#2A6B45" :
                          p.result === "lost" ? "#C4531A" : "#8A8480"
                      }} />
                    )}

                    {/* Card header */}
                    <div className="px-4 pt-3 pb-2" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-dm-sans px-2 py-0.5 rounded-full" style={{background:"rgba(255,255,255,0.04)",color:"#8A8480"}}>{p.category}</span>
                        <span className="text-xs font-dm-sans" style={{color:"#8A8480"}}>{timeAgo(p.createdAt as any)}</span>
                      </div>
                    </div>

                    <div className="px-4 py-3">

                      {/* ── BETSLIP CARD ── */}
                      {(p as any).isSlip ? (
                        <>
                          {/* Slip image — click to fullscreen */}
                          {(p as any).imageUrl && (
                            <img src={(p as any).imageUrl} alt="Betslip"
                              className="w-full rounded-xl mb-3 object-cover cursor-pointer active:opacity-80"
                              style={{maxHeight:"280px"}}
                              onClick={() => setLightboxImg((p as any).imageUrl)} />
                          )}

                          {/* Bookmaker + odds */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-dm-sans font-bold px-3 py-1 rounded-full"
                              style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>
                              🎰 {(p as any).bookmaker}
                            </span>
                            <div className="px-3 py-1.5 rounded-xl text-center" style={{background:"#D4A84B"}}>
                              <p className="font-syne font-bold text-sm text-black">Odds {p.odds}</p>
                            </div>
                          </div>

                          {/* Booking code — BIG tappable */}
                          <button
                            onClick={() => {
                              const code = (p as any).bookingCode;
                              navigator.clipboard.writeText(code);
                              toast.success(`Code ${code} copied! 🎰`);
                            }}
                            className="w-full py-4 rounded-xl mb-3 transition-all active:scale-95"
                            style={{background:"rgba(212,168,75,0.1)",border:"2px dashed rgba(212,168,75,0.4)"}}>
                            <p className="text-xs font-dm-sans mb-1" style={{color:"#8A8480"}}>Tap to copy booking code</p>
                            <p className="font-syne font-bold text-2xl tracking-widest" style={{color:"#D4A84B"}}>
                              {(p as any).bookingCode}
                            </p>
                          </button>

                          {/* Caption */}
                          {p.analysis && (
                            <p className="text-xs font-dm-sans mb-3" style={{color:"#8A8480"}}>{p.analysis}</p>
                          )}

                          {/* Confidence + stake */}
                          {((p as any).confidence || (p as any).stakeAdvice) && (
                            <div className="flex gap-2 mb-3 flex-wrap">
                              {(p as any).confidence && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                  style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
                                  🔥 {(p as any).confidence}
                                </span>
                              )}
                              {(p as any).stakeAdvice && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                  style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>
                                  🎯 {(p as any).stakeAdvice}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        /* ── NORMAL PREDICTION CARD ── */
                        <>
                          <p className="text-xs font-dm-sans mb-2" style={{color:"#8A8480"}}>
                            {getLeagueFlag(p.league)} {p.league} · 📅 {p.matchDate} {p.matchTime}
                          </p>

                          {/* Teams */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-syne font-bold text-paper">{getTeamDisplay(p.homeTeam)}</span>
                            <span className="text-xs font-dm-sans px-2" style={{color:"#8A8480"}}>vs</span>
                            <span className="font-syne font-bold text-paper">{getTeamDisplay(p.awayTeam)}</span>
                          </div>

                          {/* Tip + odds */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 px-3 py-2 rounded-xl" style={{background:"rgba(212,168,75,0.08)",border:"1px solid rgba(212,168,75,0.2)"}}>
                              <p className="text-xs font-dm-sans font-semibold" style={{color:"#D4A84B"}}>🎯 {p.tip}</p>
                            </div>
                            <div className="px-3 py-2 rounded-xl text-center" style={{background:"#D4A84B"}}>
                              <p className="font-syne font-bold text-sm text-black">{p.odds}</p>
                            </div>
                          </div>

                          {/* Image if any — click to fullscreen */}
                          {(p as any).imageUrl && (
                            <img src={(p as any).imageUrl} alt=""
                              className="w-full rounded-xl mb-3 object-cover cursor-pointer active:opacity-80"
                              style={{maxHeight:"200px"}}
                              onClick={() => setLightboxImg((p as any).imageUrl)} />
                          )}

                          {p.analysis && <p className="text-xs font-dm-sans mb-3" style={{color:"#8A8480"}}>{p.analysis}</p>}

                          {/* Spice badges */}
                          {((p as any).confidence || (p as any).formStats || (p as any).stakeAdvice) && (
                            <div className="flex gap-2 mb-3 flex-wrap">
                              {(p as any).confidence && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                  style={{background:"rgba(196,83,26,0.15)",color:"#C4531A"}}>
                                  🔥 {(p as any).confidence}
                                </span>
                              )}
                              {(p as any).stakeAdvice && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                  style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>
                                  🎯 {(p as any).stakeAdvice}
                                </span>
                              )}
                              {(p as any).formStats && (
                                <span className="text-[10px] font-dm-sans px-2 py-1 rounded-full"
                                  style={{background:"rgba(212,168,75,0.08)",color:"#D4A84B"}}>
                                  📊 {(p as any).formStats}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* ── Result banner (same for both) ── */}
                      {p.result === "won" && (
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl mb-3 font-syne font-bold text-sm"
                          style={{background:"rgba(42,107,69,0.2)",border:"1px solid rgba(42,107,69,0.4)",color:"#4ade80"}}>
                          ✅ WON
                        </div>
                      )}
                      {p.result === "lost" && (
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl mb-3 font-syne font-bold text-sm"
                          style={{background:"rgba(196,83,26,0.2)",border:"1px solid rgba(196,83,26,0.4)",color:"#f87171"}}>
                          ❌ LOST
                        </div>
                      )}
                      {p.result === "void" && (
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl mb-3 font-syne font-bold text-sm"
                          style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#8A8480"}}>
                          🔄 VOID
                        </div>
                      )}
                      {p.result === "pending" && (
                        <div className="flex items-center justify-center gap-2 py-2 rounded-xl mb-3 font-dm-sans text-xs"
                          style={{background:"rgba(212,168,75,0.06)",border:"1px solid rgba(212,168,75,0.15)",color:"#D4A84B"}}>
                          ⏳ Pending result...
                        </div>
                      )}

                      {/* Bottom row */}
                      <div className="flex items-center justify-between">
                        <button onClick={()=>handleLike(p.id!)} disabled={likedIds.has(p.id!)}
                          className="text-xs font-dm-sans transition-all"
                          style={{color: likedIds.has(p.id!) ? "#C4531A" : "#8A8480", background:"none", border:"none", cursor: likedIds.has(p.id!) ? "default" : "pointer"}}>
                          ❤️ {p.likes}
                        </button>
                        <div className="flex items-center gap-1.5">
                          {isOwner && (
                            <button onClick={()=>router.push(`/predictions/edit/${p.id}`)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                              style={{background:"rgba(255,255,255,0.06)",color:"#8A8480"}}>
                              ✏️ Edit
                            </button>
                          )}
                          {isOwner && p.result === "pending" && (
                            <div className="flex gap-1">
                              <button onClick={()=>handleUpdateResult(p.id!, "won")}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                                style={{background:"rgba(42,107,69,0.25)",color:"#4ade80",border:"1px solid rgba(42,107,69,0.3)"}}>
                                ✅ Won
                              </button>
                              <button onClick={()=>handleUpdateResult(p.id!, "lost")}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                                style={{background:"rgba(196,83,26,0.25)",color:"#f87171",border:"1px solid rgba(196,83,26,0.3)"}}>
                                ❌ Lost
                              </button>
                              <button onClick={()=>handleUpdateResult(p.id!, "void")}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                                style={{background:"rgba(255,255,255,0.06)",color:"#8A8480",border:"1px solid rgba(255,255,255,0.1)"}}>
                                🔄 Void
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIP picks */}
            {tab === "vip" && (
              <div className="space-y-3">
                {vipPicks.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted font-dm-sans mb-4">No VIP picks posted yet</p>
                    {isOwner && (
                      <Link href="/predictions/vip/post" className="px-5 py-2.5 rounded-xl font-dm-sans font-bold text-sm" style={{background:"#D4A84B",color:"#000"}}>
                        Post your first VIP pick →
                      </Link>
                    )}
                  </div>
                ) : vipPicks.map(pick => (
                  <Link key={pick.id} href={`/predictions/vip/${pick.id}`}
                    className="block p-5 rounded-2xl transition-all"
                    style={{background:"linear-gradient(135deg,rgba(212,168,75,0.06),rgba(196,83,26,0.04))",border:"1px solid rgba(212,168,75,0.2)"}}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-syne font-bold text-base text-paper">{pick.title}</h3>
                      <p className="font-syne font-bold" style={{color:"#D4A84B"}}>{pick.currency} {pick.price}</p>
                    </div>
                    <p className="text-xs font-dm-sans mb-3" style={{color:"#8A8480"}}>{pick.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-dm-sans" style={{color:"#8A8480"}}>👥 {pick.buyerCount} buyers</span>
                      <span className="text-xs font-dm-sans" style={{color:"#8A8480"}}>🔒 Locked</span>
                      <span className="text-xs font-dm-sans font-bold px-2 py-0.5 rounded-full"
                        style={{background:`${RESULT_COLORS[pick.result]}20`,color:RESULT_COLORS[pick.result]}}>
                        {RESULT_LABELS[pick.result]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* ── Lightbox ─────────────────────────────────────── */}
        {lightboxImg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{background:"rgba(0,0,0,0.95)"}}
            onClick={() => setLightboxImg("")}>
            <div className="relative w-full max-w-2xl">
              <img src={lightboxImg} alt="Betslip fullscreen"
                className="w-full rounded-2xl object-contain"
                style={{maxHeight:"90vh"}} />
              <button
                onClick={() => setLightboxImg("")}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{background:"rgba(0,0,0,0.7)",color:"#fff"}}>
                ✕
              </button>
              <p className="text-center text-xs font-dm-sans mt-3" style={{color:"#8A8480"}}>
                Tap anywhere to close
              </p>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
