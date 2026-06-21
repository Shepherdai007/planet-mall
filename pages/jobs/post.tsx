// pages/jobs/post.tsx
// ─── POST A JOB (EMPLOYER) ───────────────────────────────────────
// CA$5 flat fee per job posting, live for 30 days.
// Stores the form in sessionStorage, sends to Stripe, the job
// record is actually created on the success page after payment.

import Head           from "next/head";
import { useRouter }  from "next/router";
import { useState }   from "react";
import toast            from "react-hot-toast";
import Layout            from "@/components/Layout";
import { useAuth }       from "@/context/AuthContext";
import { JOB_CATEGORIES, JOB_POST_FEE_CAD } from "@/services/jobService";
import { PROVINCES }     from "@/services/classifiedService";

export default function PostJobPage() {
  const { user, userDoc, isLoggedIn } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title:        "",
    companyName:  userDoc?.displayName || "",
    description:  "",
    requirements: "",
    category:     JOB_CATEGORIES[0],
    jobType:      "Full-time" as "Full-time"|"Part-time"|"Contract"|"Gig"|"Internship",
    salaryMin:    "",
    salaryMax:    "",
    salaryType:   "yearly" as "hourly"|"yearly"|"negotiable",
    currency:     "CAD",
    city:         "",
    province:     "Ontario",
    country:      "Canada",
    remote:       false,
  });

  function up(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn || !user) { router.push("/auth/login?redirect=/jobs/post"); return; }
    if (!form.title || !form.companyName || !form.description || !form.city) {
      toast.error("Please fill in title, company, description, and city");
      return;
    }

    setSaving(true);
    try {
      // Stash the form so the success page can read it after Stripe redirects back
      sessionStorage.setItem("pendingJobPost", JSON.stringify(form));

      const res = await fetch("/api/stripe/create-onetime-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ product: "job_post", userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to start checkout");
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors";
  const inpStyle = { background:"#fff", borderColor:"#D4CFC6", color:"#1A1714" };

  return (
    <>
      <Head><title>Post a Job — Planet Mall</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-2xl mx-auto pt-8">
            <h1 className="font-syne font-bold text-3xl mb-1" style={{color:"#1A1714"}}>Post a job</h1>
            <p className="text-sm font-dm-sans mb-8" style={{color:"#8A8480"}}>
              CA${JOB_POST_FEE_CAD} flat fee · Live for 30 days · Reach job seekers across Planet Mall
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Job details</h2>
                <input className={inp} style={inpStyle} value={form.title} onChange={e=>up("title",e.target.value)}
                  placeholder="Job title * (e.g. Delivery Driver)" />
                <input className={inp} style={inpStyle} value={form.companyName} onChange={e=>up("companyName",e.target.value)}
                  placeholder="Company name *" />
                <select className={inp} style={inpStyle} value={form.category} onChange={e=>up("category",e.target.value)}>
                  {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select className={inp} style={inpStyle} value={form.jobType} onChange={e=>up("jobType",e.target.value)}>
                    {["Full-time","Part-time","Contract","Gig","Internship"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-dm-sans" style={{borderColor:"#D4CFC6",color:"#1A1714"}}>
                    <input type="checkbox" checked={form.remote} onChange={e=>up("remote",e.target.checked)} />
                    Remote OK
                  </label>
                </div>
              </div>

              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Description</h2>
                <textarea className={inp} style={inpStyle} rows={5} value={form.description} onChange={e=>up("description",e.target.value)}
                  placeholder="Describe the role, responsibilities, what a typical day looks like..." />
                <textarea className={inp} style={inpStyle} rows={3} value={form.requirements} onChange={e=>up("requirements",e.target.value)}
                  placeholder="Requirements — experience, certifications, must-haves..." />
              </div>

              <div className="p-6 rounded-2xl space-y-3" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Salary</h2>
                <select className={inp} style={inpStyle} value={form.salaryType} onChange={e=>up("salaryType",e.target.value)}>
                  <option value="yearly">Per year</option>
                  <option value="hourly">Per hour</option>
                  <option value="negotiable">Negotiable</option>
                </select>
                {form.salaryType !== "negotiable" && (
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inp} style={inpStyle} type="number" value={form.salaryMin} onChange={e=>up("salaryMin",e.target.value)} placeholder="Min" />
                    <input className={inp} style={inpStyle} type="number" value={form.salaryMax} onChange={e=>up("salaryMax",e.target.value)} placeholder="Max" />
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Location</h2>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inp} style={inpStyle} value={form.city} onChange={e=>up("city",e.target.value)} placeholder="City *" />
                  <select className={inp} style={inpStyle} value={form.province} onChange={e=>up("province",e.target.value)}>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Redirecting...</>
                  : `Pay CA$${JOB_POST_FEE_CAD} & post job →`}
              </button>
              <p className="text-xs text-center font-dm-sans" style={{color:"#8A8480"}}>
                Secure payment via Stripe. Job stays live for 30 days.
              </p>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
