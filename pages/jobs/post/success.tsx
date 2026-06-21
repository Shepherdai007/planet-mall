// pages/jobs/post/success.tsx
// ─── JOB POST PAYMENT SUCCESS ────────────────────────────────────
// Reads the pending form from sessionStorage (stashed before
// Stripe redirect) and creates the actual job record now that
// payment is confirmed.

import Head           from "next/head";
import Link           from "next/link";
import { useRouter }  from "next/router";
import { useEffect, useState } from "react";
import { useAuth }      from "@/context/AuthContext";
import { createJob }    from "@/services/jobService";

export default function JobPostSuccessPage() {
  const router = useRouter();
  const { user, userDoc } = useAuth();
  const [status, setStatus] = useState<"creating"|"done"|"error">("creating");
  const [jobId, setJobId]   = useState<string|null>(null);

  useEffect(() => {
    if (!router.query.session_id || !user) return;

    const raw = sessionStorage.getItem("pendingJobPost");
    if (!raw) { setStatus("error"); return; }

    async function create() {
      try {
        const form = JSON.parse(raw!);
        const id = await createJob({
          employerId:   user!.uid,
          employerName: userDoc?.displayName || "",
          companyName:  form.companyName,
          companyLogo:  userDoc?.photoURL || "",
          title:        form.title,
          description:  form.description,
          requirements: form.requirements,
          category:     form.category,
          jobType:      form.jobType,
          salaryMin:    form.salaryMin ? parseFloat(form.salaryMin) : undefined,
          salaryMax:    form.salaryMax ? parseFloat(form.salaryMax) : undefined,
          salaryType:   form.salaryType,
          currency:     form.currency,
          city:         form.city,
          province:     form.province,
          country:      form.country,
          remote:       form.remote,
        });
        sessionStorage.removeItem("pendingJobPost");
        setJobId(id);
        setStatus("done");
      } catch (err) {
        console.error("Job creation error:", err);
        setStatus("error");
      }
    }
    create();
  }, [router.query.session_id, user]);

  return (
    <>
      <Head><title>Job Posted — Planet Mall</title></Head>
      <div className="min-h-screen flex items-center justify-center px-4" style={{background:"#0E0C0A"}}>
        <div className="max-w-md w-full text-center">
          {status === "creating" && (
            <>
              <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-6" style={{borderColor:"#C4531A"}} />
              <p className="font-dm-sans text-muted">Confirming payment and posting your job...</p>
            </>
          )}

          {status === "done" && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl" style={{background:"rgba(42,107,69,0.15)"}}>
                ✅
              </div>
              <h1 className="font-syne font-bold text-3xl text-paper mb-3">Job posted!</h1>
              <p className="text-muted font-dm-sans mb-8">
                Your job is now live for 30 days. Job seekers across Planet Mall can find and apply to it.
              </p>
              <div className="flex flex-col gap-3">
                {jobId && (
                  <Link href={`/jobs/${jobId}`}
                    className="block py-3.5 rounded-xl text-white font-dm-sans font-semibold"
                    style={{background:"#C4531A"}}>
                    View your job posting →
                  </Link>
                )}
                <Link href="/jobs"
                  className="block py-3.5 rounded-xl font-dm-sans font-medium text-sm border border-white/10 text-muted hover:text-paper transition-colors">
                  Browse all jobs
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-4xl mb-4">⚠️</p>
              <h1 className="font-syne font-bold text-2xl text-paper mb-2">Something went wrong</h1>
              <p className="text-muted font-dm-sans mb-6">
                Payment may have succeeded but we couldn't create the job listing. Contact support and we'll fix it right away.
              </p>
              <Link href="/jobs/post" className="text-rust text-sm font-dm-sans">Try posting again →</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
