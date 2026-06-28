// pages/predictions/post.tsx
// ─── POST A FREE PREDICTION ───────────────────────────────────────

import Head           from "next/head";
import { useRouter }  from "next/router";
import { useState }   from "react";
import toast           from "react-hot-toast";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import { createPrediction, getTipsterProfile, SPORTS, TIP_CATEGORIES } from "@/services/predictionService";

export default function PostPredictionPage() {
  const { user, userDoc, isLoggedIn } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sport:     SPORTS[0],
    category:  TIP_CATEGORIES[0],
    matchDate: new Date().toISOString().split("T")[0],
    matchTime: "20:00",
    league:    "",
    homeTeam:  "",
    awayTeam:  "",
    tip:       "",
    odds:      "",
    analysis:  "",
  });

  function up(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn || !user || !userDoc) { router.push("/auth/login?redirect=/predictions/post"); return; }
    if (!form.homeTeam || !form.awayTeam || !form.tip || !form.odds) {
      toast.error("Please fill in teams, tip and odds");
      return;
    }

    setSaving(true);
    try {
      // Get or use basic tipster info
      const tipster = await getTipsterProfile(user.uid);
      await createPrediction({
        tipsterId:    user.uid,
        tipsterName:  tipster?.name || userDoc.displayName || "Tipster",
        tipsterPhoto: tipster?.photo || userDoc.photoURL || "",
        verified:     tipster?.verified || false,
        sport:        form.sport,
        category:     form.category,
        matchDate:    form.matchDate,
        matchTime:    form.matchTime,
        league:       form.league,
        homeTeam:     form.homeTeam,
        awayTeam:     form.awayTeam,
        tip:          form.tip,
        odds:         parseFloat(form.odds) || 0,
        analysis:     form.analysis,
      });
      toast.success("Prediction posted! 🎯");
      router.push("/predictions");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to post prediction");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none";
  const inpStyle = { background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"#F2EDE4" };

  return (
    <>
      <Head><title>Post Prediction — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#0A0908"}}>
          <div className="max-w-xl mx-auto pt-8">
            <h1 className="font-syne font-bold text-3xl text-paper mb-1">Post a prediction</h1>
            <p className="text-sm font-dm-sans mb-8" style={{color:"#8A8480"}}>Free to post. Build your following and reputation.</p>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper">Sport & category</h2>
                <div className="grid grid-cols-2 gap-3">
                  <select className={inp} style={inpStyle} value={form.sport} onChange={e=>up("sport",e.target.value)}>
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className={inp} style={inpStyle} value={form.category} onChange={e=>up("category",e.target.value)}>
                    {TIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper">Match details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inp} style={inpStyle} type="date" value={form.matchDate} onChange={e=>up("matchDate",e.target.value)} />
                  <input className={inp} style={inpStyle} type="time" value={form.matchTime} onChange={e=>up("matchTime",e.target.value)} />
                </div>
                <input className={inp} style={inpStyle} value={form.league} onChange={e=>up("league",e.target.value)} placeholder="League / Tournament (e.g. FIFA World Cup)" />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inp} style={inpStyle} value={form.homeTeam} onChange={e=>up("homeTeam",e.target.value)} placeholder="Home team *" />
                  <input className={inp} style={inpStyle} value={form.awayTeam} onChange={e=>up("awayTeam",e.target.value)} placeholder="Away team *" />
                </div>
              </div>

              <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper">Your prediction</h2>
                <input className={inp} style={inpStyle} value={form.tip} onChange={e=>up("tip",e.target.value)} placeholder="Tip * (e.g. Argentina Over 1.5 Goals)" />
                <input className={inp} style={inpStyle} type="number" step="0.01" value={form.odds} onChange={e=>up("odds",e.target.value)} placeholder="Odds * (e.g. 1.35)" />
                <textarea className={inp} style={inpStyle} rows={3} value={form.analysis} onChange={e=>up("analysis",e.target.value)} placeholder="Analysis / reasoning (optional)" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting...</> : "Post prediction →"}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
