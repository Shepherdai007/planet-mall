// pages/insurance/request.tsx
// ─── REQUEST AN INSURANCE QUOTE ──────────────────────────────────
// Buyer fills in their details. Verified brokers matching the
// insurance type get notified instantly.

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useState }   from "react";
import toast           from "react-hot-toast";
import Layout          from "@/components/Layout";
import { useAuth }     from "@/context/AuthContext";
import { submitInsuranceRequest, INSURANCE_TYPES } from "@/services/insuranceService";
import { PROVINCES }   from "@/services/classifiedService";

const TYPE_ICONS: Record<string,string> = {
  Auto: "🚗", Home: "🏠", Life: "❤️", Business: "💼", Travel: "✈️", Health: "🩺", Other: "📋",
};

export default function InsuranceRequestPage() {
  const { user, userDoc, isLoggedIn } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    insuranceType: "Auto",
    fullName:      userDoc?.displayName || "",
    phone:         "",
    email:         userDoc?.email || "",
    city:          "",
    province:      "Ontario",
    details:       "",
  });

  function up(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) { router.push("/auth/login?redirect=/insurance/request"); return; }
    if (!form.fullName || !form.phone || !form.city) {
      toast.error("Please fill in your name, phone, and city");
      return;
    }

    setSaving(true);
    try {
      await submitInsuranceRequest({
        buyerId:    user!.uid,
        buyerName:  form.fullName,
        buyerPhoto: userDoc?.photoURL || "",
        insuranceType: form.insuranceType as any,
        fullName:   form.fullName,
        phone:      form.phone,
        email:      form.email,
        city:       form.city,
        province:   form.province,
        details:    form.details,
      });
      setSubmitted(true);
      toast.success("Request sent to brokers! 🎉");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit request");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors";
  const inpStyle = { background:"#fff", borderColor:"#D4CFC6", color:"#1A1714" };

  if (submitted) {
    return (
      <>
        <Head><title>Request Sent — Planet Mall Insurance</title></Head>
        <Layout>
          <div className="min-h-screen flex items-center justify-center px-4" style={{background:"#F6F1E9"}}>
            <div className="max-w-md text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{background:"rgba(42,107,69,0.1)"}}>
                <span className="text-4xl">✅</span>
              </div>
              <h1 className="font-syne font-bold text-2xl mb-2" style={{color:"#1A1714"}}>Request sent!</h1>
              <p className="font-dm-sans text-sm mb-8" style={{color:"#8A8480"}}>
                Verified {form.insuranceType.toLowerCase()} insurance brokers near {form.city} have been notified.
                They'll reach out to you by phone or message with a quote.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/" className="px-5 py-3 rounded-xl text-sm font-dm-sans font-semibold" style={{background:"#C4531A",color:"#fff"}}>
                  Back to home
                </Link>
                <Link href="/insurance/become-broker" className="px-5 py-3 rounded-xl text-sm font-dm-sans font-semibold border" style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                  Are you a broker?
                </Link>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head><title>Get an Insurance Quote — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-2xl mx-auto pt-8">
            <h1 className="font-syne font-bold text-3xl mb-1" style={{color:"#1A1714"}}>Get an insurance quote</h1>
            <p className="text-sm font-dm-sans mb-8" style={{color:"#8A8480"}}>
              Tell us what you need — verified local brokers will reach out with a quote. Free, no obligation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Insurance type */}
              <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg mb-4" style={{color:"#1A1714"}}>What kind of insurance?</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {INSURANCE_TYPES.map(t => (
                    <button key={t} type="button" onClick={()=>up("insuranceType",t)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                      style={{
                        background: form.insuranceType===t ? "#C4531A" : "#F6F1E9",
                        border:     `1px solid ${form.insuranceType===t ? "#C4531A" : "#E8E2D9"}`,
                      }}>
                      <span className="text-xl">{TYPE_ICONS[t]}</span>
                      <span className="text-[10px] font-dm-sans" style={{color: form.insuranceType===t ? "#fff" : "#8A8480"}}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Your details */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Your details</h2>
                <input className={inp} style={inpStyle} value={form.fullName} onChange={e=>up("fullName",e.target.value)} placeholder="Full name *" />
                <input className={inp} style={inpStyle} type="tel" value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="Phone number *" />
                <input className={inp} style={inpStyle} type="email" value={form.email} onChange={e=>up("email",e.target.value)} placeholder="Email address" />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inp} style={inpStyle} value={form.city} onChange={e=>up("city",e.target.value)} placeholder="City *" />
                  <select className={inp} style={inpStyle} value={form.province} onChange={e=>up("province",e.target.value)}>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg mb-3" style={{color:"#1A1714"}}>Tell us more</h2>
                <textarea className={inp} style={inpStyle} rows={4} value={form.details} onChange={e=>up("details",e.target.value)}
                  placeholder={
                    form.insuranceType === "Auto" ? "e.g. 2020 Honda Civic, clean driving record, looking for full coverage..."
                    : form.insuranceType === "Home" ? "e.g. 3-bedroom house, built 2015, looking for homeowner's insurance..."
                    : "Share any details that will help a broker give you an accurate quote..."
                  } />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                  : "Send to brokers →"}
              </button>
              <p className="text-xs text-center font-dm-sans" style={{color:"#8A8480"}}>
                Free service. Your information is only shared with verified insurance brokers.
              </p>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
