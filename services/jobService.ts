// services/jobService.ts
// ─── JOB POSTING SYSTEM ──────────────────────────────────────────
// Employers pay CA$5 to post a job (30-day listing, same expiry
// pattern as classifieds). Job seekers browse/search and apply
// with an uploaded resume or the AI Resume Builder.

import {
  doc, collection, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Job {
  id?:            string;
  employerId:     string;
  employerName:   string;
  companyName:    string;
  companyLogo:    string;
  title:          string;
  description:    string;
  category:       string;
  jobType:        "Full-time" | "Part-time" | "Contract" | "Gig" | "Internship";
  salaryMin?:     number;
  salaryMax?:     number;
  salaryType:     "hourly" | "yearly" | "negotiable";
  currency:       string;
  city:           string;
  province:       string;
  country:        string;
  remote:         boolean;
  requirements:   string;
  status:         "active" | "expired" | "filled";
  views:          number;
  applicantCount: number;
  createdAt:      unknown;
  expiresAt:      unknown;
}

export interface JobApplication {
  id?:            string;
  jobId:          string;
  jobTitle:       string;
  employerId:     string;
  applicantId:    string;
  applicantName:  string;
  applicantEmail: string;
  applicantPhone: string;
  resumeUrl:      string;      // uploaded PDF or AI-generated resume URL
  resumeSource:   "uploaded" | "ai_generated" | "profile";
  coverNote:      string;
  status:         "submitted" | "reviewed" | "shortlisted" | "rejected" | "hired";
  createdAt:      unknown;
}

export const JOB_CATEGORIES = [
  "Customer Service", "Retail", "Food & Hospitality", "Trades & Labour",
  "Driving & Delivery", "Healthcare", "Administrative", "Sales & Marketing",
  "IT & Tech", "Education", "Cleaning & Maintenance", "Warehouse", "Other",
];

export const JOB_POST_FEE_CAD = 5;

// ── Create a job listing (called after Stripe payment confirms) ───
export async function createJob(data: Omit<Job, "id" | "createdAt" | "expiresAt" | "views" | "applicantCount" | "status">): Promise<string> {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const ref = await addDoc(collection(db, "jobs"), {
    ...data,
    status:         "active",
    views:          0,
    applicantCount: 0,
    createdAt:      serverTimestamp(),
    expiresAt:      expires,
  });
  return ref.id;
}

// ── Browse jobs with filters ───────────────────────────────────────
export async function getJobs(filters: {
  category?: string;
  city?:     string;
  jobType?:  string;
  search?:   string;
  limit?:    number;
} = {}): Promise<Job[]> {
  const snap = await getDocs(query(collection(db, "jobs"), where("status", "==", "active")));
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Job));

  if (filters.category && filters.category !== "All") {
    results = results.filter(j => j.category === filters.category);
  }
  if (filters.jobType && filters.jobType !== "All") {
    results = results.filter(j => j.jobType === filters.jobType);
  }
  if (filters.city) {
    results = results.filter(j => j.city.toLowerCase().includes(filters.city!.toLowerCase()));
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    results = results.filter(j =>
      j.title.toLowerCase().includes(s) ||
      j.companyName.toLowerCase().includes(s) ||
      j.description.toLowerCase().includes(s)
    );
  }

  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  if (filters.limit) results = results.slice(0, filters.limit);
  return results;
}

// ── Get single job + increment view ────────────────────────────────
export async function getJob(id: string): Promise<Job | null> {
  const snap = await getDoc(doc(db, "jobs", id));
  if (!snap.exists()) return null;
  updateDoc(doc(db, "jobs", id), { views: increment(1) }).catch(() => {});
  return { id: snap.id, ...snap.data() } as Job;
}

// ── Employer's own job posts ───────────────────────────────────────
export async function getMyJobs(employerId: string): Promise<Job[]> {
  const snap = await getDocs(query(collection(db, "jobs"), where("employerId", "==", employerId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

export async function updateJob(id: string, data: Partial<Job>): Promise<void> {
  await updateDoc(doc(db, "jobs", id), data as any);
}

export async function deleteJob(id: string): Promise<void> {
  await deleteDoc(doc(db, "jobs", id));
}

// ── Submit a job application ───────────────────────────────────────
export async function submitApplication(
  data: Omit<JobApplication, "id" | "createdAt" | "status">
): Promise<string> {
  const ref = await addDoc(collection(db, "jobApplications"), {
    ...data,
    status:    "submitted",
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "jobs", data.jobId), { applicantCount: increment(1) });
  return ref.id;
}

// ── Get applications for a job (employer view) ──────────────────────
export async function getJobApplications(jobId: string): Promise<JobApplication[]> {
  const snap = await getDocs(query(collection(db, "jobApplications"), where("jobId", "==", jobId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

// ── Get a job seeker's own applications ──────────────────────────────
export async function getMyApplications(applicantId: string): Promise<JobApplication[]> {
  const snap = await getDocs(query(collection(db, "jobApplications"), where("applicantId", "==", applicantId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

export async function updateApplicationStatus(id: string, status: JobApplication["status"]): Promise<void> {
  await updateDoc(doc(db, "jobApplications", id), { status });
}

// ── Check if user already applied to a job ────────────────────────────
export async function hasApplied(jobId: string, applicantId: string): Promise<boolean> {
  const snap = await getDocs(query(
    collection(db, "jobApplications"),
    where("jobId", "==", jobId),
    where("applicantId", "==", applicantId)
  ));
  return !snap.empty;
}
