// pages/predictions/index.tsx
// ─── PLANET MALL PREDICTIONS ──────────────────────────────────────
// Browse free tips by sport and date.
// VIP picks shown separately with lock icon until purchased.

import Head           from "next/head";
import Link           from "next/link";
import { useEffect, useState } from "react";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import { getPredictions, getVIPPicks, getAllTipsters, SPORTS, likePrediction, followTipster, unfollowTipster, isFollowingTipster } from "@/services/predictionService";
import { getTeamDisplay, getLeagueFlag } from "@/lib/countryFlags";
import { timeAgo }     from "@/lib/helpers";
import toast           from "react-hot-toast";
import type { Prediction, VIPPick, Tipster } from "@/services/predictionService";

const RESULT_COLORS: Record<string, string> = {
  pending: "#8A8480",
  won:     "#2A6B45",
  lost:    "#C4531A",
  void:    "#8A8480",
};

const RESULT_LABELS: Record<string, string> = {
  pending: "⏳ Pending",
  won:     "✅ Won",
  lost:    "❌ Lost",
  void:    "🔄 Void",
};

export default function PredictionsPage() {
  const { user, isLoggedIn } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [vipPicks,    setVipPicks]    = useState<VIPPick[]>([]);
  const [tipsters,    setTipsters]    = useState<Tipster[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sport,       setSport]       = useState("All");
  const [tab,         setTab]         = useState<"free"|"vip"|"tipsters">("free");

  useEffect(() => { load(); }, [sport]);

  async function load() {
    setLoading(true);
    const [preds, vips, tips] = await Promise.all([
      getPredictions({ sport, limit: 50 }),
      getVIPPicks({ sport: sport === "All" ? undefined : sport }),
      getAllTipsters(),
    ]);
    setPredictions(preds);
    setVipPicks(vips);
    setTipsters(tips);
    setLoading(false);
  }

  async function handleLike(id: string) {
    if (!isLoggedIn) { toast.error("Sign in to like predictions"); return; }
    await likePrediction(id);
    setPredictions(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  }

  // Today's date for display
  const today = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric" }).replace(/\//g,".");

  return (
    <>
      <Head>
        <title>Predictions — Planet Mall</title>
        <meta name="description" content="Sports betting predictions and tips from verified tipsters. Free daily picks and VIP fixed games." />
      </Head>
      <Layout>
        <div className="min-h-screen pb-20" style={{background:"#0A0908"}}>

          {/* Hero */}
          <div className="py-10 px-4 text-center" style={{background:"linear-gradient(135deg,#1A1714,#0A0908)"}}>
            <p className="text-4xl mb-3">🏆</p>
            <h1 className="font-syne font-bold text-3xl sm:text-4xl text-paper mb-2">Planet Mall Predictions</h1>
            <p className="text-muted font-dm-sans mb-6">Free daily tips & VIP picks from verified tipsters</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/predictions/post"
                className="px-5 py-2.5 rounded-xl text-white font-dm-sans font-semibold text-sm"
                style={{background:"#C4531A"}}>
                + Post free tip
              </Link>
              <Link href="/predictions/vip/post"
                className="px-5 py-2.5 rounded-xl font-dm-sans font-semibold text-sm"
                style={{background:"rgba(212,168,75,0.15)",color:"#D4A84B",border:"1px solid rgba(212,168,75,0.3)"}}>
                ⭐ Sell VIP picks
              </Link>
              <Link href="/predictions/profile"
                className="px-5 py-2.5 rounded-xl font-dm-sans font-semibold text-sm border"
                style={{borderColor:"rgba(255,255,255,0.1)",color:"#8A8480"}}>
                My tipster profile
              </Link>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 pt-6">

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {([
                { key:"free",     label:"Free Tips" },
                { key:"vip",      label:"⭐ VIP Picks" },
                { key:"tipsters", label:"Tipsters" },
              ] as const).map(t => (
                <button key={t.key} onClick={()=>setTab(t.key)}
                  className="px-4 py-2 rounded-xl text-sm font-dm-sans font-medium transition-all"
                  style={{
                    background: tab===t.key ? "#C4531A" : "rgba(255,255,255,0.04)",
                    color:      tab===t.key ? "#fff" : "#8A8480",
                    border:     `1px solid ${tab===t.key ? "#C4531A" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sport filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {["All", ...SPORTS].map(s => (
                <button key={s} onClick={()=>setSport(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-dm-sans whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    background: sport===s ? "rgba(196,83,26,0.2)" : "rgba(255,255,255,0.04)",
                    color:      sport===s ? "#C4531A" : "#8A8480",
                    border:     `1px solid ${sport===s ? "#C4531A" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  {s}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
              </div>
            ) : (
              <>
                {/* FREE TIPS */}
                {tab === "free" && (
                  <div className="space-y-3">
                    {predictions.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-4xl mb-4">⚽</p>
                        <p className="font-dm-sans text-muted mb-4">No predictions yet for today</p>
                        <Link href="/predictions/post" className="px-5 py-2.5 rounded-xl text-white font-dm-sans font-semibold text-sm" style={{background:"#C4531A"}}>
                          Be the first to post →
                        </Link>
                      </div>
                    ) : predictions.map(p => (
                      <div key={p.id} className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                        {/* Tipster header */}
                        <Link href={`/predictions/tipster/${p.tipsterId}`}>
                          <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold flex-shrink-0"
                              style={{background:"rgba(196,83,26,0.2)",color:"#C4531A"}}>
                              {p.tipsterPhoto ? <img src={p.tipsterPhoto} alt="" className="w-full h-full object-cover" /> : p.tipsterName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-dm-sans font-semibold text-sm text-paper">{p.tipsterName}</span>
                                {p.verified && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{background:"rgba(42,107,69,0.2)",color:"#2A6B45"}}>✓ Verified</span>}
                              </div>
                              <p className="text-[10px] text-muted font-dm-sans">{timeAgo(p.createdAt as any)} · {p.sport}</p>
                            </div>
                            <span className="text-xs font-dm-sans px-2 py-1 rounded-full" style={{background:"rgba(255,255,255,0.04)",color:"#8A8480"}}>{p.category}</span>
                          </div>
                        </Link>

                        {/* Match */}
                        <div className="px-4 py-3">
                          <p className="text-xs font-dm-sans mb-2" style={{color:"#8A8480"}}>
                            {getLeagueFlag(p.league)} {p.league} · 📅 {p.matchDate} {p.matchTime}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-syne font-bold text-paper">{getTeamDisplay(p.homeTeam)}</span>
                            <span className="text-xs font-dm-sans px-2" style={{color:"#8A8480"}}>vs</span>
                            <span className="font-syne font-bold text-paper">{getTeamDisplay(p.awayTeam)}</span>
                          </div>

                          {/* Tip + Odds */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 px-3 py-2 rounded-xl" style={{background:"rgba(212,168,75,0.08)",border:"1px solid rgba(212,168,75,0.2)"}}>
                              <p className="text-xs font-dm-sans font-semibold" style={{color:"#D4A84B"}}>🎯 {p.tip}</p>
                            </div>
                            <div className="px-3 py-2 rounded-xl text-center" style={{background:"#D4A84B"}}>
                              <p className="font-syne font-bold text-sm text-black">{p.odds}</p>
                            </div>
                          </div>

                          {p.analysis && (
                            <p className="text-xs font-dm-sans mb-3 leading-relaxed" style={{color:"#8A8480"}}>{p.analysis}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-dm-sans font-bold px-2.5 py-1 rounded-full"
                              style={{background:`${RESULT_COLORS[p.result]}20`,color:RESULT_COLORS[p.result]}}>
                              {RESULT_LABELS[p.result]}
                            </span>
                            <div className="flex items-center gap-3">
                              <button onClick={()=>handleLike(p.id!)} className="flex items-center gap-1 text-xs font-dm-sans" style={{color:"#8A8480"}}>
                                ❤️ {p.likes}
                              </button>
                              <button onClick={()=>{
                                const url = `${window.location.origin}/predictions`;
                                if (navigator.share) {
                                  navigator.share({ title: `${p.homeTeam} vs ${p.awayTeam}`, text: `🎯 Tip: ${p.tip} @ ${p.odds}`, url });
                                } else {
                                  navigator.clipboard.writeText(url);
                                  toast.success("Link copied!");
                                }
                              }} className="text-xs font-dm-sans" style={{color:"#8A8480"}}>
                                📤 Share
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* VIP PICKS */}
                {tab === "vip" && (
                  <div className="space-y-3">
                    {vipPicks.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-4xl mb-4">⭐</p>
                        <p className="font-dm-sans text-muted mb-4">No VIP picks available right now</p>
                        <Link href="/predictions/vip/post" className="px-5 py-2.5 rounded-xl text-white font-dm-sans font-semibold text-sm" style={{background:"#D4A84B",color:"#000"}}>
                          Sell your first VIP pick →
                        </Link>
                      </div>
                    ) : vipPicks.map(pick => (
                      <Link key={pick.id} href={`/predictions/vip/${pick.id}`}
                        className="block rounded-2xl overflow-hidden transition-all"
                        style={{background:"linear-gradient(135deg,rgba(212,168,75,0.06),rgba(196,83,26,0.04))",border:"1px solid rgba(212,168,75,0.2)"}}>
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold flex-shrink-0"
                                style={{background:"rgba(212,168,75,0.2)",color:"#D4A84B"}}>
                                {pick.tipsterPhoto ? <img src={pick.tipsterPhoto} alt="" className="w-full h-full object-cover" /> : pick.tipsterName?.[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-dm-sans font-semibold text-sm text-paper">{pick.tipsterName}</span>
                                  {pick.verified && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{background:"rgba(42,107,69,0.2)",color:"#2A6B45"}}>✓</span>}
                                </div>
                                <p className="text-[10px] text-muted font-dm-sans">{pick.sport} · {pick.matchDate}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-syne font-bold text-lg" style={{color:"#D4A84B"}}>{pick.currency} {pick.price}</p>
                              <p className="text-[10px] text-muted font-dm-sans">{pick.buyerCount} buyers</p>
                            </div>
                          </div>

                          <h3 className="font-syne font-bold text-base text-paper mb-2">{pick.title}</h3>
                          <p className="text-xs font-dm-sans mb-3" style={{color:"#8A8480"}}>{pick.description}</p>

                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full font-dm-sans" style={{background:"rgba(255,255,255,0.04)",color:"#8A8480"}}>🔒 Locked until purchased</span>
                            <span className="text-xs font-dm-sans" style={{color:"#8A8480"}}>⚡ Escrow protected</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* TIPSTERS */}
                {tab === "tipsters" && (
                  <div className="space-y-3">
                    {tipsters.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-4xl mb-4">🏆</p>
                        <p className="font-dm-sans text-muted mb-4">No tipsters yet</p>
                        <Link href="/predictions/profile" className="px-5 py-2.5 rounded-xl text-white font-dm-sans font-semibold text-sm" style={{background:"#C4531A"}}>
                          Create your tipster profile →
                        </Link>
                      </div>
                    ) : tipsters.map(t => {
                      const winRate = t.totalPicks > 0 ? Math.round((t.winCount / t.totalPicks) * 100) : 0;
                      return (
                        <Link key={t.id} href={`/predictions/tipster/${t.userId}`}
                          className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                          style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-lg"
                            style={{background:"rgba(196,83,26,0.2)",color:"#C4531A"}}>
                            {t.photo ? <img src={t.photo} alt="" className="w-full h-full object-cover" /> : t.name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-dm-sans font-semibold text-paper">{t.name}</p>
                              {t.verified && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{background:"rgba(42,107,69,0.2)",color:"#2A6B45"}}>✓ Verified</span>}
                            </div>
                            <p className="text-xs font-dm-sans truncate" style={{color:"#8A8480"}}>{t.bio}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-dm-sans" style={{color:"#2A6B45"}}>✅ {winRate}% win rate</span>
                              <span className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>{t.totalPicks} picks</span>
                              <span className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>{t.followers} followers</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <p className="font-syne font-bold text-lg" style={{color: winRate >= 60 ? "#2A6B45" : winRate >= 40 ? "#D4A84B" : "#C4531A"}}>{winRate}%</p>
                            {user && user.uid !== t.userId && (
                              <button onClick={async (e) => {
                                e.preventDefault();
                                if (!isLoggedIn) { toast.error("Sign in to follow"); return; }
                                await followTipster(t.userId, user.uid);
                                toast.success(`Following ${t.name}!`);
                              }} className="px-3 py-1 rounded-full text-[10px] font-dm-sans font-bold"
                                style={{background:"rgba(196,83,26,0.15)",color:"#C4531A",border:"1px solid rgba(196,83,26,0.3)"}}>
                                + Follow
                              </button>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
