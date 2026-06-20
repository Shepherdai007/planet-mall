// pages/insurance/become-broker.tsx
// ─── BROKER REGISTRATION ─────────────────────────────────────────
// Sellers/users apply to become a verified insurance broker.
// Pending admin verification before they appear in directory
// or receive leads.

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useState, useEffect } from "react";
import toast            from "react-hot-toast";
import Layout           from "@/components/Layout";
import { useAuth }      from "@/context/AuthContext";
import { registerBroker, getBrokerProfile, INSURANCE_TYPES } from "@/services/insuranceService";
import { PROVINCES }    from "@/services/classifiedService";
import type { InsuranceBroker } from "@/services/insuranceService";

export default function BecomeBrokerPage() {
  const { user, userDoc, isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<InsuranceBroker | null>(null);
  const [checking, setChecking] = useState(true);

  const [form, setForm] = useState({
    brokerName:    userDoc?.displayName || "",
    companyName:   "",
    licenseNumber: "",
    specialties:   [] as string[],
    city:          "",
    province:      "Ontario",
    phone:         "",
    bio:           "",
  });

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    getBrokerProfile(user.uid).then(b => { setExisting(b); setChecking(false); });
  }, [user]);

  function up(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function toggleSpecialty(t: string) {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(t)
        ? f.specialties.filter(s => s !== t)
        : [...f.specialties, t],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) { router.push("/auth/login?redirect=/insurance/become-broker"); return; }
    if (!form.brokerName || !form.licenseNumber || !form.phone || form.specialties.length === 0) {
      toast.error("Please fill in all required fields and select at least one specialty");
      return;
    }

    setSaving(true);
    try {
      await registerBroker({
        userId:        user!.uid,
        brokerName:    form.brokerName,
        companyName:   form.companyName,
        photo:         userDoc?.photoURL || "",
        licenseNumber: form.licenseNumber,
        specialties:   form.specialties,
        city:          form.city,
        province:      form.province,
        phone:         form.phone,
        bio:           form.bio,
      });
      toast.success("Application submitted! We'll verify and notify you. 🎉");
      router.push("/profile");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit application");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors";
  const inpStyle = { background:"#fff", borderColor:"#D4CFC6", color:"#1A1714" };

  if (checking || loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#F6F1E9"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    </Layout>
  );

  if (existing) {
    return (
      <>
        <Head><title>Broker Status — Planet Mall</title></Head>
        <Layout>
          <div className="min-h-screen flex items-center justify-center px-4" style={{background:"#F6F1E9"}}>
            <div className="max-w-md text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{background: existing.verified ? "rgba(42,107,69,0.1)" : "rgba(212,168,75,0.1)"}}>
                <span className="text-4xl">{existing.verified ? "✅" : "⏳"}</span>
              </div>
              <h1 className="font-syne font-bold text-2xl mb-2" style={{color:"#1A1714"}}>
                {existing.verified ? "You're a verified broker!" : "Application pending review"}
              </h1>
              <p className="font-dm-sans text-sm mb-8" style={{color:"#8A8480"}}>
                {existing.verified
                  ? "You're receiving leads for: " + existing.specialties.join(", ")
                  : "We're reviewing your application. This usually takes 1-2 business days."}
              </p>
              {existing.verified && (
                <Link href="/insurance/broker-dashboard" className="px-5 py-3 rounded-xl text-sm font-dm-sans font-semibold inline-block" style={{background:"#C4531A",color:"#fff"}}>
                  Go to dashboard →
                </Link>
              )}
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head><title>Become a Broker — Planet Mall Insurance</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-2xl mx-auto pt-8">
            <h1 className="font-syne font-bold text-3xl mb-1" style={{color:"#1A1714"}}>Become a verified broker</h1>
            <p className="text-sm font-dm-sans mb-8" style={{color:"#8A8480"}}>
              Get matched with buyers actively looking for insurance quotes in your area.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Broker info</h2>
                <input className={inp} style={inpStyle} value={form.brokerName} onChange={e=>up("brokerName",e.target.value)} placeholder="Your full name *" />
                <input className={inp} style={inpStyle} value={form.companyName} onChange={e=>up("companyName",e.target.value)} placeholder="Company / brokerage name" />
                <input className={inp} style={inpStyle} value={form.licenseNumber} onChange={e=>up("licenseNumber",e.target.value)} placeholder="License number *" />
                <input className={inp} style={inpStyle} type="tel" value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="Phone number *" />
              </div>

              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Specialties * (select all that apply)</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {INSURANCE_TYPES.map(t => (
                    <button key={t} type="button" onClick={()=>toggleSpecialty(t)}
                      className="py-2.5 rounded-xl text-xs font-dm-sans font-medium transition-all"
                      style={{
                        background: form.specialties.includes(t) ? "#C4531A" : "#F6F1E9",
                        color:      form.specialties.includes(t) ? "#fff" : "#8A8480",
                        border:     `1px solid ${form.specialties.includes(t) ? "#C4531A" : "#D4CFC6"}`,
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Location</h2>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inp} style={inpStyle} value={form.city} onChange={e=>up("city",e.target.value)} placeholder="City" />
                  <select className={inp} style={inpStyle} value={form.province} onChange={e=>up("province",e.target.value)}>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg mb-3" style={{color:"#1A1714"}}>About you (optional)</h2>
                <textarea className={inp} style={inpStyle} rows={3} value={form.bio} onChange={e=>up("bio",e.target.value)}
                  placeholder="Years of experience, areas of expertise, why buyers should choose you..." />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                  : "Submit application →"}
              </button>
              <p className="text-xs text-center font-dm-sans" style={{color:"#8A8480"}}>
                Applications are reviewed within 1-2 business days.
              </p>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
