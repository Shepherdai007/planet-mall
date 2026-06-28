// pages/predictions/profile.tsx
// ─── TIPSTER PROFILE SETUP ────────────────────────────────────────
// Tipsters set up their profile with bio and social channel links.
// Telegram, WhatsApp, Twitter, Instagram, YouTube all supported.

import Head           from "next/head";
import { useRouter }  from "next/router";
import { useState, useEffect } from "react";
import toast           from "react-hot-toast";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import { getTipsterProfile, createTipsterProfile, updateTipsterProfile } from "@/services/predictionService";
import type { Tipster } from "@/services/predictionService";

export default function TipsterProfilePage() {
  const { user, userDoc, isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [saving,    setSaving]    = useState(false);
  const [checking,  setChecking]  = useState(true);
  const [existing,  setExisting]  = useState<Tipster | null>(null);

  const [form, setForm] = useState({
    name:      "",
    bio:       "",
    telegram:  "",
    whatsapp:  "",
    twitter:   "",
    instagram: "",
    youtube:   "",
    facebook:  "",
    threads:   "",
  });

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    getTipsterProfile(user.uid).then(t => {
      if (t) {
        setExisting(t);
        setForm({
          name:      t.name,
          bio:       t.bio || "",
          telegram:  t.telegram || "",
          whatsapp:  t.whatsapp || "",
          twitter:   t.twitter || "",
          instagram: t.instagram || "",
          youtube:   t.youtube || "",
          facebook:  t.facebook || "",
          threads:   t.threads || "",
        });
      } else {
        setForm(f => ({ ...f, name: userDoc?.displayName || "" }));
      }
      setChecking(false);
    });
  }, [user]);

  function up(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn || !user) { router.push("/auth/login?redirect=/predictions/profile"); return; }
    if (!form.name) { toast.error("Please enter your tipster name"); return; }

    setSaving(true);
    try {
      if (existing) {
        await updateTipsterProfile(existing.id!, { ...form });
        toast.success("Profile updated! ✅");
      } else {
        await createTipsterProfile({
          userId:    user.uid,
          photo:     userDoc?.photoURL || "",
          ...form,
        });
        toast.success("Tipster profile created! 🎉");
      }
      router.push("/predictions");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none";
  const inpStyle = { background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"#F2EDE4" };

  if (checking || loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#0A0908"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    </Layout>
  );

  return (
    <>
      <Head><title>Tipster Profile — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#0A0908"}}>
          <div className="max-w-xl mx-auto pt-8">
            <h1 className="font-syne font-bold text-3xl text-paper mb-1">
              {existing ? "Edit tipster profile" : "Create tipster profile"}
            </h1>
            <p className="text-sm font-dm-sans mb-8" style={{color:"#8A8480"}}>
              Add your social channels so followers can join your Telegram/WhatsApp groups.
            </p>

            {existing?.verified && (
              <div className="mb-6 p-4 rounded-2xl flex items-center gap-3"
                style={{background:"rgba(42,107,69,0.1)",border:"1px solid rgba(42,107,69,0.2)"}}>
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-dm-sans font-bold text-sm" style={{color:"#2A6B45"}}>Verified Tipster</p>
                  <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Your verified badge shows on all your predictions</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper">Basic info</h2>
                <input className={inp} style={inpStyle} value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Tipster name / channel name *" />
                <textarea className={inp} style={inpStyle} rows={3} value={form.bio} onChange={e=>up("bio",e.target.value)}
                  placeholder="Tell people about yourself — your win rate, specialties, how long you've been tipping..." />
              </div>

              <div className="p-5 rounded-2xl space-y-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 className="font-syne font-bold text-base text-paper">Your channels</h2>
                <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Add your links so followers can join your groups for more tips</p>

                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">✈️</span>
                  <input className={inp} style={inpStyle} value={form.telegram} onChange={e=>up("telegram",e.target.value)} placeholder="Telegram channel link (t.me/...)" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">💬</span>
                  <input className={inp} style={inpStyle} value={form.whatsapp} onChange={e=>up("whatsapp",e.target.value)} placeholder="WhatsApp channel link" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">🐦</span>
                  <input className={inp} style={inpStyle} value={form.twitter} onChange={e=>up("twitter",e.target.value)} placeholder="Twitter / X handle (@...)" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">📸</span>
                  <input className={inp} style={inpStyle} value={form.instagram} onChange={e=>up("instagram",e.target.value)} placeholder="Instagram handle (@...)" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">▶️</span>
                  <input className={inp} style={inpStyle} value={form.youtube} onChange={e=>up("youtube",e.target.value)} placeholder="YouTube channel link" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">📘</span>
                  <input className={inp} style={inpStyle} value={form.facebook} onChange={e=>up("facebook",e.target.value)} placeholder="Facebook page link" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">🧵</span>
                  <input className={inp} style={inpStyle} value={form.threads} onChange={e=>up("threads",e.target.value)} placeholder="Threads handle (@...)" />
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : existing ? "Save changes →" : "Create profile →"}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
