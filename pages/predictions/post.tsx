// pages/predictions/post.tsx
// ─── POST A FREE PREDICTION ───────────────────────────────────────

import Head           from "next/head";
import { useRouter }  from "next/router";
import { useState, useRef } from "react";
import toast           from "react-hot-toast";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import { createPrediction, getTipsterProfile, SPORTS, TIP_CATEGORIES } from "@/services/predictionService";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const CONFIDENCE_LEVELS = ["Low", "Medium", "High", "Very High"];
const STAKE_UNITS       = ["1 Unit", "2 Units", "3 Units", "4 Units", "5 Units"];
const BOOKMAKERS        = ["SportyBet", "Bet9ja", "1xBet", "Betway", "BetKing", "Parimatch", "Melbet", "Other"];

interface Game {
  homeTeam:  string;
  awayTeam:  string;
  league:    string;
  matchDate: string;
  matchTime: string;
  tip:       string;
  odds:      string;
}

const emptyGame = (): Game => ({
  homeTeam:  "",
  awayTeam:  "",
  league:    "",
  matchDate: new Date().toISOString().split("T")[0],
  matchTime: "20:00",
  tip:       "",
  odds:      "",
});

export default function PostPredictionPage() {
  const { user, userDoc, isLoggedIn } = useAuth();
  const router  = useRouter();
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgPreview,setImgPreview]= useState("");
  const [imgFile,   setImgFile]   = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<"prediction" | "betslip">("prediction");

  // Multiple games
  const [games, setGames] = useState<Game[]>([emptyGame()]);

  const [form, setForm] = useState({
    sport:        SPORTS[0],
    category:     TIP_CATEGORIES[0],
    analysis:     "",
    confidence:   "High",
    formStats:    "",
    matchContext: "",
    stakeAdvice:  "2 Units",
    // Betslip
    bookingCode:  "",
    bookmaker:    "SportyBet",
    totalOdds:    "",
    slipCaption:  "",
  });

  function up(field: string, value: any) { setForm(f => ({ ...f, [field]: value })); }

  function updateGame(index: number, field: keyof Game, value: string) {
    setGames(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
  }

  function addGame() {
    if (games.length >= 10) { toast.error("Max 10 games per prediction"); return; }
    setGames(prev => [...prev, emptyGame()]);
  }

  function removeGame(index: number) {
    if (games.length === 1) { toast.error("Need at least 1 game"); return; }
    setGames(prev => prev.filter((_, i) => i !== index));
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  }

  // Combined odds for multi-game
  const combinedOdds = games.reduce((acc, g) => {
    const o = parseFloat(g.odds);
    return isNaN(o) ? acc : acc * o;
  }, 1).toFixed(2);

  const CONFIDENCE_COLORS: Record<string, string> = {
    "Low":       "rgba(138,132,128,0.25)",
    "Medium":    "rgba(212,168,75,0.25)",
    "High":      "rgba(196,83,26,0.25)",
    "Very High": "rgba(42,107,69,0.25)",
  };
  const CONFIDENCE_TEXT: Record<string, string> = {
    "Low":       "#8A8480",
    "Medium":    "#D4A84B",
    "High":      "#C4531A",
    "Very High": "#2A6B45",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn || !user || !userDoc) { router.push("/auth/login?redirect=/predictions/post"); return; }

    if (postType === "prediction") {
      const invalid = games.find(g => !g.homeTeam || !g.awayTeam || !g.tip || !g.odds);
      if (invalid) { toast.error("Fill in all game fields"); return; }
    } else {
      if (!form.bookingCode || !form.totalOdds) {
        toast.error("Please add booking code and total odds");
        return;
      }
    }

    setSaving(true);
    try {
      let imageUrl = "";
      if (imgFile) {
        setUploading(true);
        const storage = getStorage();
        const sRef    = storageRef(storage, `predictions/${user.uid}/${Date.now()}_${imgFile.name}`);
        await uploadBytes(sRef, imgFile);
        imageUrl = await getDownloadURL(sRef);
        setUploading(false);
      }

      const tipster = await getTipsterProfile(user.uid);

      if (postType === "prediction") {
        // Post each game as a separate prediction linked by a groupId
        const groupId = games.length > 1 ? `group_${Date.now()}` : "";
        for (const game of games) {
          await createPrediction({
            tipsterId:    user.uid,
            tipsterName:  tipster?.name || userDoc.displayName || "Tipster",
            tipsterPhoto: tipster?.photo || userDoc.photoURL || "",
            verified:     tipster?.verified || false,
            sport:        form.sport,
            category:     form.category,
            matchDate:    game.matchDate,
            matchTime:    game.matchTime,
            league:       game.league,
            homeTeam:     game.homeTeam,
            awayTeam:     game.awayTeam,
            tip:          game.tip,
            odds:         parseFloat(game.odds) || 0,
            analysis:     form.analysis,
            confidence:   form.confidence,
            formStats:    form.formStats,
            matchContext: form.matchContext,
            stakeAdvice:  form.stakeAdvice,
            imageUrl,
            groupId,
            totalGames:   games.length,
          } as any);
        }
      } else {
        await createPrediction({
          tipsterId:    user.uid,
          tipsterName:  tipster?.name || userDoc.displayName || "Tipster",
          tipsterPhoto: tipster?.photo || userDoc.photoURL || "",
          verified:     tipster?.verified || false,
          sport:        form.sport,
          category:     "Betslip",
          matchDate:    new Date().toISOString().split("T")[0],
          matchTime:    "00:00",
          league:       form.bookmaker,
          homeTeam:     "Betslip",
          awayTeam:     form.bookmaker,
          tip:          `CODE: ${form.bookingCode}`,
          odds:         parseFloat(form.totalOdds) || 0,
          analysis:     form.slipCaption,
          confidence:   form.confidence,
          formStats:    "",
          matchContext: "",
          stakeAdvice:  form.stakeAdvice,
          imageUrl,
          bookingCode:  form.bookingCode,
          bookmaker:    form.bookmaker,
          isSlip:       true,
        } as any);
      }

      toast.success(postType === "prediction" ? `${games.length} game${games.length > 1 ? "s" : ""} posted! 🎯` : "Betslip posted! 🎰");
      router.push("/predictions");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to post");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  // Shared input styles — dark background so text is always visible
  const inp      = "w-full px-4 py-3 rounded-xl text-sm font-dm-sans focus:outline-none";
  const inpStyle = {
    background:  "#1a1714",
    border:      "1px solid rgba(255,255,255,0.1)",
    color:       "#F2EDE4",
  };
  const selStyle = {
    ...inpStyle,
    appearance: "none" as const,
  };

  return (
    <>
      <Head><title>Post Prediction — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#0A0908"}}>
          <div className="max-w-xl mx-auto pt-8">
            <h1 className="font-syne font-bold text-3xl text-paper mb-1">Post a tip</h1>
            <p className="text-sm font-dm-sans mb-6" style={{color:"#8A8480"}}>Free to post. Build your following and reputation.</p>

            {/* Toggle */}
            <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{background:"rgba(255,255,255,0.04)"}}>
              {(["prediction","betslip"] as const).map(t => (
                <button key={t} type="button" onClick={() => setPostType(t)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-dm-sans font-bold transition-all capitalize"
                  style={{
                    background: postType === t ? "#C4531A" : "transparent",
                    color:      postType === t ? "#fff"    : "#8A8480",
                  }}>
                  {t === "prediction" ? "🎯 Prediction" : "🎰 Betslip"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {postType === "prediction" ? (
                <>
                  {/* Sport & Category */}
                  <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <h2 className="font-syne font-bold text-base text-paper">Sport & category</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <select className={inp} style={selStyle} value={form.sport} onChange={e=>up("sport",e.target.value)}>
                        {SPORTS.map(s => <option key={s} value={s} style={{background:"#1a1714",color:"#F2EDE4"}}>{s}</option>)}
                      </select>
                      <select className={inp} style={selStyle} value={form.category} onChange={e=>up("category",e.target.value)}>
                        {TIP_CATEGORIES.map(c => <option key={c} value={c} style={{background:"#1a1714",color:"#F2EDE4"}}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Games */}
                  <div className="space-y-3">
                    {games.map((game, index) => (
                      <div key={index} className="p-5 rounded-2xl space-y-3"
                        style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>

                        {/* Game header */}
                        <div className="flex items-center justify-between">
                          <h2 className="font-syne font-bold text-base text-paper">
                            {games.length > 1 ? `⚽ Game ${index + 1}` : "⚽ Match details"}
                          </h2>
                          {games.length > 1 && (
                            <button type="button" onClick={() => removeGame(index)}
                              className="text-xs font-bold px-2 py-1 rounded-lg"
                              style={{background:"rgba(196,83,26,0.2)",color:"#C4531A"}}>
                              ✕ Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <input className={inp} style={inpStyle} type="date"
                            value={game.matchDate} onChange={e=>updateGame(index,"matchDate",e.target.value)} />
                          <input className={inp} style={inpStyle} type="time"
                            value={game.matchTime} onChange={e=>updateGame(index,"matchTime",e.target.value)} />
                        </div>
                        <input className={inp} style={inpStyle}
                          value={game.league} onChange={e=>updateGame(index,"league",e.target.value)}
                          placeholder="League / Tournament (e.g. FIFA World Cup)" />
                        <div className="grid grid-cols-2 gap-3">
                          <input className={inp} style={inpStyle}
                            value={game.homeTeam} onChange={e=>updateGame(index,"homeTeam",e.target.value)}
                            placeholder="Home team *" />
                          <input className={inp} style={inpStyle}
                            value={game.awayTeam} onChange={e=>updateGame(index,"awayTeam",e.target.value)}
                            placeholder="Away team *" />
                        </div>
                        <input className={inp} style={inpStyle}
                          value={game.tip} onChange={e=>updateGame(index,"tip",e.target.value)}
                          placeholder="Tip * (e.g. Home Win, Over 2.5)" />
                        <input className={inp} style={inpStyle} type="number" step="0.01"
                          value={game.odds} onChange={e=>updateGame(index,"odds",e.target.value)}
                          placeholder="Odds * (e.g. 1.75)" />
                      </div>
                    ))}

                    {/* Combined odds display for multi-game */}
                    {games.length > 1 && (
                      <div className="px-4 py-3 rounded-xl flex items-center justify-between"
                        style={{background:"rgba(212,168,75,0.08)",border:"1px solid rgba(212,168,75,0.2)"}}>
                        <span className="text-sm font-dm-sans font-semibold" style={{color:"#D4A84B"}}>
                          🎯 Combined Odds ({games.length} games)
                        </span>
                        <span className="font-syne font-bold text-lg" style={{color:"#D4A84B"}}>{combinedOdds}</span>
                      </div>
                    )}

                    {/* Add game button */}
                    {games.length < 10 && (
                      <button type="button" onClick={addGame}
                        className="w-full py-3 rounded-xl text-sm font-dm-sans font-bold transition-all flex items-center justify-center gap-2"
                        style={{background:"rgba(255,255,255,0.04)",border:"1px dashed rgba(255,255,255,0.15)",color:"#8A8480"}}>
                        + Add Another Game
                      </button>
                    )}
                  </div>

                  {/* Analysis */}
                  <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <h2 className="font-syne font-bold text-base text-paper">Analysis</h2>
                    <textarea className={inp} style={inpStyle} rows={3}
                      value={form.analysis} onChange={e=>up("analysis",e.target.value)}
                      placeholder="Analysis / reasoning (optional)" />
                  </div>

                  {/* 🔥 SPICE */}
                  <div className="p-5 rounded-2xl space-y-4" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <h2 className="font-syne font-bold text-base text-paper">🔥 Add spice</h2>

                    {/* Confidence */}
                    <div>
                      <label className="text-xs font-dm-sans font-semibold mb-2 block" style={{color:"#8A8480"}}>CONFIDENCE LEVEL</label>
                      <div className="grid grid-cols-4 gap-2">
                        {CONFIDENCE_LEVELS.map(c => (
                          <button key={c} type="button" onClick={() => up("confidence", c)}
                            className="py-2 rounded-xl text-xs font-bold transition-all"
                            style={{
                              background: form.confidence === c ? CONFIDENCE_COLORS[c] : "rgba(255,255,255,0.03)",
                              color:      form.confidence === c ? CONFIDENCE_TEXT[c]   : "#8A8480",
                              border:     `1px solid ${form.confidence === c ? CONFIDENCE_TEXT[c] : "rgba(255,255,255,0.08)"}`,
                            }}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stake advice */}
                    <div>
                      <label className="text-xs font-dm-sans font-semibold mb-2 block" style={{color:"#8A8480"}}>🎯 BANKROLL ADVICE</label>
                      <div className="flex gap-2 flex-wrap">
                        {STAKE_UNITS.map(s => (
                          <button key={s} type="button" onClick={() => up("stakeAdvice", s)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            style={{
                              background: form.stakeAdvice === s ? "rgba(196,83,26,0.2)" : "rgba(255,255,255,0.03)",
                              color:      form.stakeAdvice === s ? "#C4531A"              : "#8A8480",
                              border:     `1px solid ${form.stakeAdvice === s ? "#C4531A" : "rgba(255,255,255,0.08)"}`,
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Form stats */}
                    <div>
                      <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>📊 FORM STATS (optional)</label>
                      <input className={inp} style={inpStyle} value={form.formStats}
                        onChange={e=>up("formStats",e.target.value)}
                        placeholder="e.g. Brazil won 6 of last 8 vs Japan" />
                    </div>

                    {/* Match context */}
                    <div>
                      <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>🏟️ MATCH CONTEXT (optional)</label>
                      <input className={inp} style={inpStyle} value={form.matchContext}
                        onChange={e=>up("matchContext",e.target.value)}
                        placeholder="e.g. Home advantage, key injury, weather" />
                    </div>

                    {/* Image upload */}
                    <div>
                      <label className="text-xs font-dm-sans font-semibold mb-2 block" style={{color:"#8A8480"}}>📸 IMAGE (optional)</label>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                      {imgPreview ? (
                        <div className="relative rounded-xl overflow-hidden mb-2">
                          <img src={imgPreview} alt="" className="w-full max-h-48 object-cover" />
                          <button type="button" onClick={() => { setImgFile(null); setImgPreview(""); }}
                            className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold"
                            style={{background:"rgba(0,0,0,0.7)",color:"#fff"}}>✕ Remove</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className="w-full py-8 rounded-xl border-2 border-dashed text-sm font-dm-sans"
                          style={{borderColor:"rgba(255,255,255,0.1)",color:"#8A8480"}}>
                          📸 Tap to upload image
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* ── BETSLIP MODE ── */
                <div className="p-5 rounded-2xl space-y-4" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                  <h2 className="font-syne font-bold text-base text-paper">🎰 Betslip details</h2>

                  {/* Bookmaker */}
                  <div>
                    <label className="text-xs font-dm-sans font-semibold mb-2 block" style={{color:"#8A8480"}}>BOOKMAKER</label>
                    <div className="flex gap-2 flex-wrap">
                      {BOOKMAKERS.map(b => (
                        <button key={b} type="button" onClick={() => up("bookmaker", b)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: form.bookmaker === b ? "rgba(196,83,26,0.2)" : "rgba(255,255,255,0.03)",
                            color:      form.bookmaker === b ? "#C4531A"              : "#8A8480",
                            border:     `1px solid ${form.bookmaker === b ? "#C4531A" : "rgba(255,255,255,0.08)"}`,
                          }}>
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Booking code */}
                  <div>
                    <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>BOOKING CODE *</label>
                    <input className={inp}
                      style={{...inpStyle, fontSize:"20px", fontWeight:"bold", letterSpacing:"4px", textAlign:"center", color:"#D4A84B"}}
                      value={form.bookingCode}
                      onChange={e=>up("bookingCode", e.target.value.toUpperCase())}
                      placeholder="EB7JBE" />
                    <p className="text-[10px] font-dm-sans mt-1 text-center" style={{color:"#8A8480"}}>Followers tap to copy this code</p>
                  </div>

                  {/* Total odds */}
                  <div>
                    <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>TOTAL ODDS *</label>
                    <input className={inp} style={inpStyle} type="number" step="0.01"
                      value={form.totalOdds} onChange={e=>up("totalOdds",e.target.value)} placeholder="e.g. 6.09" />
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="text-xs font-dm-sans font-semibold mb-1.5 block" style={{color:"#8A8480"}}>CAPTION (optional)</label>
                    <textarea className={inp} style={inpStyle} rows={2}
                      value={form.slipCaption} onChange={e=>up("slipCaption",e.target.value)}
                      placeholder="e.g. 3 banker games today 🔥 trust the process!" />
                  </div>

                  {/* Slip image */}
                  <div>
                    <label className="text-xs font-dm-sans font-semibold mb-2 block" style={{color:"#8A8480"}}>📸 UPLOAD SLIP SCREENSHOT</label>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                    {imgPreview ? (
                      <div className="relative rounded-xl overflow-hidden mb-2">
                        <img src={imgPreview} alt="" className="w-full object-cover rounded-xl" />
                        <button type="button" onClick={() => { setImgFile(null); setImgPreview(""); }}
                          className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold"
                          style={{background:"rgba(0,0,0,0.7)",color:"#fff"}}>✕ Remove</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full py-10 rounded-xl border-2 border-dashed text-sm font-dm-sans"
                        style={{borderColor:"rgba(196,83,26,0.3)",color:"#C4531A"}}>
                        📸 Upload your betslip screenshot
                      </button>
                    )}
                  </div>

                  {/* Confidence */}
                  <div>
                    <label className="text-xs font-dm-sans font-semibold mb-2 block" style={{color:"#8A8480"}}>CONFIDENCE LEVEL</label>
                    <div className="grid grid-cols-4 gap-2">
                      {CONFIDENCE_LEVELS.map(c => (
                        <button key={c} type="button" onClick={() => up("confidence", c)}
                          className="py-2 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: form.confidence === c ? CONFIDENCE_COLORS[c] : "rgba(255,255,255,0.03)",
                            color:      form.confidence === c ? CONFIDENCE_TEXT[c]   : "#8A8480",
                            border:     `1px solid ${form.confidence === c ? CONFIDENCE_TEXT[c] : "rgba(255,255,255,0.08)"}`,
                          }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stake */}
                  <div>
                    <label className="text-xs font-dm-sans font-semibold mb-2 block" style={{color:"#8A8480"}}>🎯 BANKROLL ADVICE</label>
                    <div className="flex gap-2 flex-wrap">
                      {STAKE_UNITS.map(s => (
                        <button key={s} type="button" onClick={() => up("stakeAdvice", s)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: form.stakeAdvice === s ? "rgba(196,83,26,0.2)" : "rgba(255,255,255,0.03)",
                            color:      form.stakeAdvice === s ? "#C4531A"              : "#8A8480",
                            border:     `1px solid ${form.stakeAdvice === s ? "#C4531A" : "rgba(255,255,255,0.08)"}`,
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={saving || uploading}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {uploading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>
                 : saving   ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting...</>
                 : postType === "prediction"
                   ? `Post ${games.length} Game${games.length > 1 ? "s" : ""} 🎯`
                   : "Post Betslip 🎰"}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
