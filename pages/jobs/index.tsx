// pages/jobs/index.tsx
// ─── BROWSE JOBS ──────────────────────────────────────────────────
// Indeed-style search and filter. Free to browse for job seekers.

import Head           from "next/head";
import Link           from "next/link";
import { useEffect, useState } from "react";
import Layout            from "@/components/Layout";
import { getJobs, JOB_CATEGORIES, JOB_POST_FEE_CAD } from "@/services/jobService";
import { timeAgo }       from "@/lib/helpers";
import type { Job }      from "@/services/jobService";

const JOB_TYPES = ["All", "Full-time", "Part-time", "Contract", "Gig", "Internship"];

export default function JobsPage() {
  const [jobs,     setJobs]     = useState<Job[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [city,     setCity]     = useState("");
  const [category, setCategory] = useState("All");
  const [jobType,  setJobType]  = useState("All");

  useEffect(() => { load(); }, [category, jobType]);

  async function load() {
    setLoading(true);
    const results = await getJobs({ category, jobType, limit: 60 });
    setJobs(results);
    setLoading(false);
  }

  const filtered = jobs.filter(j => {
    const matchSearch = !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.companyName.toLowerCase().includes(search.toLowerCase());
    const matchCity = !city || j.city.toLowerCase().includes(city.toLowerCase());
    return matchSearch && matchCity;
  });

  function formatSalary(j: Job) {
    if (j.salaryType === "negotiable" || (!j.salaryMin && !j.salaryMax)) return "Salary negotiable";
    const suffix = j.salaryType === "hourly" ? "/hr" : "/yr";
    if (j.salaryMin && j.salaryMax) return `${j.currency} ${j.salaryMin.toLocaleString()}–${j.salaryMax.toLocaleString()}${suffix}`;
    return `${j.currency} ${(j.salaryMin || j.salaryMax)?.toLocaleString()}${suffix}`;
  }

  return (
    <>
      <Head>
        <title>Jobs — Planet Mall</title>
        <meta name="description" content="Find your next job on Planet Mall. Browse local jobs across all categories — full-time, part-time, contract, and gig work." />
      </Head>
      <Layout>
        <div className="min-h-screen pb-20" style={{background:"#F6F1E9",color:"#1A1714"}}>

          {/* Hero */}
          <div className="py-10 px-4 text-center" style={{background:"#1A1714"}}>
            <h1 className="font-syne font-bold text-3xl sm:text-4xl text-paper mb-2">Planet Mall Jobs</h1>
            <p className="text-muted font-dm-sans mb-6">Find your next opportunity — local jobs, real employers.</p>

            <div className="max-w-2xl mx-auto flex gap-3 flex-wrap sm:flex-nowrap">
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Job title or company..."
                className="flex-1 min-w-[140px] px-4 py-3 rounded-xl text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none"
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)"}} />
              <input value={city} onChange={e=>setCity(e.target.value)}
                placeholder="City..."
                className="w-32 px-4 py-3 rounded-xl text-sm font-dm-sans text-paper placeholder:text-muted/40 focus:outline-none"
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)"}} />
              <Link href="/jobs/post"
                className="px-5 py-3 rounded-xl text-white font-dm-sans font-semibold text-sm whitespace-nowrap"
                style={{background:"#C4531A"}}>
                + Post a job
              </Link>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">

            {/* Resume builder banner */}
            <div className="mb-6 p-4 rounded-2xl flex items-center gap-4"
              style={{background:"linear-gradient(135deg,rgba(212,168,75,0.1),rgba(196,83,26,0.08))",border:"1px solid rgba(212,168,75,0.2)"}}>
              <span className="text-3xl flex-shrink-0">📄</span>
              <div className="flex-1 min-w-0">
                <p className="font-dm-sans font-bold text-sm" style={{color:"#1A1714"}}>Need a resume that gets noticed?</p>
                <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Let AI build you a professional resume — CA$2, ready in minutes</p>
              </div>
              <Link href="/jobs/resume-builder"
                className="flex-shrink-0 px-4 py-2 rounded-xl text-white text-xs font-dm-sans font-bold"
                style={{background:"#D4A84B"}}>
                Build my resume
              </Link>
            </div>

            {/* Job type tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {JOB_TYPES.map(t => (
                <button key={t} onClick={()=>setJobType(t)}
                  className="px-4 py-1.5 rounded-full text-xs font-dm-sans font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    background: jobType===t ? "#C4531A" : "#fff",
                    color:      jobType===t ? "#fff" : "#8A8480",
                    border:     `1px solid ${jobType===t ? "#C4531A" : "#E8E2D9"}`,
                  }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {["All", ...JOB_CATEGORIES].map(c => (
                <button key={c} onClick={()=>setCategory(c)}
                  className="px-3 py-1 rounded-full text-[11px] font-dm-sans whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    background: category===c ? "rgba(196,83,26,0.1)" : "transparent",
                    color:      category===c ? "#C4531A" : "#8A8480",
                    border:     `1px solid ${category===c ? "#C4531A" : "#E8E2D9"}`,
                  }}>
                  {c}
                </button>
              ))}
            </div>

            <p className="text-sm font-dm-sans mb-5" style={{color:"#8A8480"}}>
              {filtered.length} job{filtered.length !== 1 ? "s" : ""} found
            </p>

            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_,i) => (
                  <div key={i} className="h-28 rounded-2xl animate-pulse" style={{background:"#fff",border:"1px solid #E8E2D9"}} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-5xl mb-4">💼</p>
                <h2 className="font-syne font-bold text-2xl mb-2" style={{color:"#1A1714"}}>No jobs yet</h2>
                <p className="font-dm-sans mb-6" style={{color:"#8A8480"}}>Be the first to post a job opportunity!</p>
                <Link href="/jobs/post"
                  className="px-6 py-3 rounded-full text-white font-dm-sans font-semibold inline-block"
                  style={{background:"#C4531A"}}>
                  Post a job — CA${JOB_POST_FEE_CAD}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(job => (
                  <Link key={job.id} href={`/jobs/${job.id}`}
                    className="block p-5 rounded-2xl transition-all hover:shadow-md"
                    style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{background:"#F6F1E9"}}>
                        {job.companyLogo
                          ? <img src={job.companyLogo} alt="" className="w-full h-full object-cover" />
                          : <span className="text-xl">💼</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-dm-sans font-bold text-base" style={{color:"#1A1714"}}>{job.title}</p>
                        <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>{job.companyName} · 📍 {job.city}, {job.province}{job.remote ? " · Remote OK" : ""}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-dm-sans" style={{background:"#F6F1E9",color:"#8A8480"}}>{job.jobType}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold" style={{background:"rgba(42,107,69,0.1)",color:"#2A6B45"}}>{formatSalary(job)}</span>
                          <span className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>{timeAgo(job.createdAt as any)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
