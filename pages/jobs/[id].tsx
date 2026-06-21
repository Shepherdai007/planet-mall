// pages/jobs/[id].tsx
// ─── JOB DETAIL + APPLY ──────────────────────────────────────────

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useState, useEffect, useRef } from "react";
import toast            from "react-hot-toast";
import Layout            from "@/components/Layout";
import { useAuth }       from "@/context/AuthContext";
import { getJob, submitApplication, hasApplied } from "@/services/jobService";
import { timeAgo }       from "@/lib/helpers";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage }       from "@/lib/firebase";
import type { Job }      from "@/services/jobService";

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, userDoc, isLoggedIn } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [job,       setJob]       = useState<Job|null>(null);
  const [loading,   setLoading]   = useState(true);
  const [applied,   setApplied]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [resumeFile, setResumeFile] = useState<File|null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [phone,      setPhone]      = useState("");

  useEffect(() => {
    if (!id) return;
    getJob(id as string).then(j => { setJob(j); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    hasApplied(id as string, user.uid).then(setApplied);
  }, [user, id]);

  function formatSalary(j: Job) {
    if (j.salaryType === "negotiable" || (!j.salaryMin && !j.salaryMax)) return "Salary negotiable";
    const suffix = j.salaryType === "hourly" ? "/hr" : "/yr";
    if (j.salaryMin && j.salaryMax) return `${j.currency} ${j.salaryMin.toLocaleString()}–${j.salaryMax.toLocaleString()}${suffix}`;
    return `${j.currency} ${(j.salaryMin || j.salaryMax)?.toLocaleString()}${suffix}`;
  }

  async function handleApply() {
    if (!isLoggedIn) { router.push(`/auth/login?redirect=/jobs/${id}`); return; }
    setShowModal(true);
  }

  async function handleSubmitApplication() {
    if (!user || !userDoc || !job) return;
    if (!resumeFile) {
      toast.error("Please upload a resume, or build one with AI first");
      return;
    }
    setSubmitting(true);
    try {
      setUploading(true);
      const path = `applications/${user.uid}/${job.id}_${Date.now()}_${resumeFile.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, resumeFile);
      await new Promise((res, rej) => task.on("state_changed", null, rej, res as any));
      const resumeUrl = await getDownloadURL(task.snapshot.ref);
      setUploading(false);

      await submitApplication({
        jobId:          job.id!,
        jobTitle:       job.title,
        employerId:     job.employerId,
        applicantId:    user.uid,
        applicantName:  userDoc.displayName,
        applicantEmail: userDoc.email,
        applicantPhone: phone,
        resumeUrl,
        resumeSource:   "uploaded",
        coverNote,
      });

      setApplied(true);
      setShowModal(false);
      toast.success("Application submitted! 🎉");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#F6F1E9"}}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:"#C4531A"}} />
      </div>
    </Layout>
  );

  if (!job) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center" style={{background:"#F6F1E9"}}>
        <div className="text-center">
          <p className="text-4xl mb-4">💼</p>
          <p className="font-dm-sans" style={{color:"#8A8480"}}>Job not found</p>
          <Link href="/jobs" className="mt-4 inline-block text-sm font-dm-sans" style={{color:"#C4531A"}}>← Back to jobs</Link>
        </div>
      </div>
    </Layout>
  );

  const isOwner = user?.uid === job.employerId;

  return (
    <>
      <Head><title>{job.title} at {job.companyName} — Planet Mall Jobs</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-3xl mx-auto pt-6">

            <div className="flex items-center gap-2 text-xs font-dm-sans mb-6" style={{color:"#8A8480"}}>
              <Link href="/jobs" className="hover:underline">Jobs</Link>
              <span>›</span>
              <span>{job.category}</span>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl mb-5" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{background:"#F6F1E9"}}>
                  {job.companyLogo
                    ? <img src={job.companyLogo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-2xl">💼</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-syne font-bold text-2xl" style={{color:"#1A1714"}}>{job.title}</h1>
                  <p className="text-sm font-dm-sans mt-0.5" style={{color:"#8A8480"}}>
                    {job.companyName} · 📍 {job.city}, {job.province}{job.remote ? " · Remote OK" : ""}
                  </p>
                  <p className="text-xs font-dm-sans mt-1" style={{color:"#8A8480"}}>
                    Posted {timeAgo(job.createdAt as any)} · 👁 {job.views} views · {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-6">
                <span className="px-3 py-1 rounded-full text-xs font-dm-sans font-medium" style={{background:"#F6F1E9",color:"#8A8480"}}>{job.jobType}</span>
                <span className="px-3 py-1 rounded-full text-xs font-dm-sans font-semibold" style={{background:"rgba(42,107,69,0.1)",color:"#2A6B45"}}>{formatSalary(job)}</span>
                <span className="px-3 py-1 rounded-full text-xs font-dm-sans font-medium" style={{background:"#F6F1E9",color:"#8A8480"}}>{job.category}</span>
              </div>

              <h2 className="font-syne font-bold text-base mb-2" style={{color:"#1A1714"}}>About this role</h2>
              <p className="font-dm-sans text-sm leading-relaxed mb-5 whitespace-pre-line" style={{color:"#4A4440"}}>
                {job.description}
              </p>

              {job.requirements && (
                <>
                  <h2 className="font-syne font-bold text-base mb-2" style={{color:"#1A1714"}}>Requirements</h2>
                  <p className="font-dm-sans text-sm leading-relaxed whitespace-pre-line" style={{color:"#4A4440"}}>
                    {job.requirements}
                  </p>
                </>
              )}
            </div>

            {!isOwner && (
              applied ? (
                <div className="p-5 rounded-2xl text-center" style={{background:"rgba(42,107,69,0.06)",border:"1px solid rgba(42,107,69,0.2)"}}>
                  <p className="font-dm-sans font-semibold text-sm" style={{color:"#2A6B45"}}>✓ You've applied to this job</p>
                </div>
              ) : (
                <button onClick={handleApply}
                  className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base"
                  style={{background:"#C4531A"}}>
                  Apply now →
                </button>
              )
            )}

            {isOwner && (
              <Link href={`/seller/job-applicants?jobId=${job.id}`}
                className="block w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base text-center"
                style={{background:"#1A1714"}}>
                View {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""} →
              </Link>
            )}
          </div>
        </div>

        {/* Apply modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-4"
            style={{background:"rgba(0,0,0,0.5)"}}>
            <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{background:"#fff"}}>
              <h3 className="font-syne font-bold text-lg mb-1" style={{color:"#1A1714"}}>Apply to {job.title}</h3>
              <p className="text-xs font-dm-sans mb-5" style={{color:"#8A8480"}}>at {job.companyName}</p>

              <div className="mb-4">
                <label className="block text-xs font-dm-sans mb-1.5" style={{color:"#8A8480"}}>Phone number</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel"
                  className="w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none"
                  style={{borderColor:"#D4CFC6",color:"#1A1714"}} placeholder="Your phone number" />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-dm-sans mb-1.5" style={{color:"#8A8480"}}>Resume *</label>
                {resumeFile ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{borderColor:"#2A6B45",background:"rgba(42,107,69,0.04)"}}>
                    <span className="text-sm font-dm-sans truncate" style={{color:"#1A1714"}}>📄 {resumeFile.name}</span>
                    <button onClick={()=>setResumeFile(null)} className="text-xs" style={{color:"#8A8480"}}>×</button>
                  </div>
                ) : (
                  <button onClick={()=>fileRef.current?.click()}
                    className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-dm-sans"
                    style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                    📎 Upload resume (PDF)
                  </button>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                  onChange={e => setResumeFile(e.target.files?.[0] || null)} />

                <div className="mt-3 p-3 rounded-xl flex items-center gap-3" style={{background:"rgba(212,168,75,0.08)",border:"1px solid rgba(212,168,75,0.2)"}}>
                  <span className="text-lg flex-shrink-0">✨</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-dm-sans font-semibold" style={{color:"#1A1714"}}>No resume? No problem.</p>
                    <p className="text-[11px] font-dm-sans" style={{color:"#8A8480"}}>Let AI build a professional one for CA$2</p>
                  </div>
                  <Link href={`/jobs/resume-builder?jobId=${job.id}`}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-white text-[11px] font-dm-sans font-bold"
                    style={{background:"#D4A84B"}}>
                    Build →
                  </Link>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-dm-sans mb-1.5" style={{color:"#8A8480"}}>Cover note (optional)</label>
                <textarea value={coverNote} onChange={e=>setCoverNote(e.target.value)} rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-sm font-dm-sans resize-none focus:outline-none"
                  style={{borderColor:"#D4CFC6",color:"#1A1714"}} placeholder="A quick note to the employer..." />
              </div>

              <div className="flex gap-3">
                <button onClick={()=>setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-dm-sans border" style={{borderColor:"#D4CFC6",color:"#8A8480"}}>
                  Cancel
                </button>
                <button onClick={handleSubmitApplication} disabled={submitting || !resumeFile}
                  className="flex-1 py-3 rounded-xl text-sm font-dm-sans font-bold text-white disabled:opacity-50"
                  style={{background:"#C4531A"}}>
                  {submitting ? (uploading ? "Uploading..." : "Submitting...") : "Submit application"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
