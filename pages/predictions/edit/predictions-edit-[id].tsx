// pages/predictions/edit/[id].tsx
// ─── EDIT A PREDICTION ───────────────────────────────────────────

import Head           from "next/head";
import { useRouter }  from "next/router";
import { useState, useEffect } from "react";
import toast           from "react-hot-toast";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import { getDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db }          from "@/lib/firebase";
import { SPORTS, TIP_CATEGORIES } from "@/services/predictionService";

export default function EditPredictionPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [notOwner, setNotOwner] = useState(false);

  const [form, setForm] = useState({
    sport:     "",
    category:  "",
    matchDate: "",
    matchTime: "",
    league:    "",
    homeTeam:  "",
    awayTeam:  "",
    tip:       "",
    odds:      "",
    analysis:  "",
  });

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "predictions", id as string)).then(snap => {
      if (!snap.exists()) { router.push("/predictions"); return; }
      const data = snap.data();
      if (data.tipsterId !== user?.uid) { setNotOwner(true); setLoading(false); return; }
      setForm({
        sport:     data.sport || "",
        category:  data.category || "",
        matchDate: data.matchDate || "",
        matchTime: data.matchTime || "",
        league:    data.league || "",
        homeTeam:  data.homeTeam || "",
        awayTeam:  data.awayTeam || "",
        tip:       data.tip || "",
        odds:      String(data.odds || ""),
        analysis:  data.analysis || "",
      });
      setLoading(false);
    });
  }, [id, user]);

  function up(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.homeTeam || !form.awayTeam || !form.tip || !form.odds) {
      toast.error("Please fill in teams, tip and odds");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "predictions", id as string), {
        sport:     form.sport,
        category:  form.category,
        matchDate: form.matchDate,
        matchTime: form.matchTime,
        league:    form.league,
        homeTeam:  form.homeTeam,
        awayTeam:  form.awayTeam,
        tip:       form.tip,
        odds:      parseFloat(form.odds) || 0,
        analysis:  form.analysis,
      });
      toast.success("Prediction updated! ✅");
      router.back();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this prediction? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "predictions", id as string));
      toast.success("Prediction deleted");
      router.push(`/predictions/tipster/${user?.uid}`);
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none";
  const inpStyle = { background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"#F2EDE4" };

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#0A0908"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    </Layout>
  );

  if (notOwner) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#0A0908"}}>
        <p className="font-dm-sans text-muted">You don't have permission to edit this prediction.</p>
      </div>
    </Layout>
  );

  return (
    <>
      <Head><title>Edit Prediction — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#0A0908"}}>
          <div className="max-w-xl mx-auto pt-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-syne font-bold text-2xl text-paper">Edit prediction</h1>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-dm-sans font-bold disabled:opacity-50"
                style={{background:"rgba(196,83,26,0.15)",color:"#C4531A",border:"1px solid rgba(196,83,26,0.3)"}}>
                {deleting ? "Deleting..." : "🗑 Delete"}
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">

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
                <input className={inp} style={inpStyle} value={form.league} onChange={e=>up("league",e.target.value)} placeholder="League / Tournament" />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inp} style={inpStyle} value={form.homeTeam} onChange={e=>up("homeTeam",e.target.value)} placeholder="Home team *" />
                  <input className={inp} style={inpStyle} value={form.awayTeam} onChange={e=>up("awayTeam",e.target.value)} placeholder="Away team *" />
                </div>
              </div>

              <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper">Your prediction</h2>
                <input className={inp} style={inpStyle} value={form.tip} onChange={e=>up("tip",e.target.value)} placeholder="Tip *" />
                <input className={inp} style={inpStyle} type="number" step="0.01" value={form.odds} onChange={e=>up("odds",e.target.value)} placeholder="Odds *" />
                <textarea className={inp} style={inpStyle} rows={3} value={form.analysis} onChange={e=>up("analysis",e.target.value)} placeholder="Analysis / reasoning" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : "Save changes →"}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
