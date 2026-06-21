// services/resumeService.ts
// ─── AI RESUME BUILDER ────────────────────────────────────────────
// CA$2 one-time fee. Collects structured info from a questionnaire,
// sends it to Claude to produce polished resume content, then
// renders it server-side as a PDF stored in Firebase Storage.

import {
  doc, collection, addDoc, getDoc, getDocs, query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ResumeInput {
  fullName:       string;
  email:          string;
  phone:          string;
  city:           string;
  targetJobTitle: string;        // what role they're applying for / building toward
  summary:        string;        // optional rough notes — AI polishes this
  workHistory: {
    title:      string;
    company:    string;
    duration:   string;
    highlights: string;          // rough bullet notes, AI will refine
  }[];
  education: {
    school:     string;
    program:    string;
    year:       string;
  }[];
  skills:         string;        // comma-separated raw input
}

export interface Resume {
  id?:          string;
  userId:       string;
  input:        ResumeInput;
  generatedContent: {
    summary:    string;
    experience: { title: string; company: string; duration: string; bullets: string[] }[];
    education:  { school: string; program: string; year: string }[];
    skills:     string[];
  };
  pdfUrl:       string;
  jobId?:       string;          // if built/tailored for a specific job application
  paid:         boolean;
  createdAt:    unknown;
}

export const RESUME_FEE_CAD = 2;

// ── Save a resume after AI generation + payment confirms ──────────────
export async function saveResume(data: Omit<Resume, "id" | "createdAt" | "paid">): Promise<string> {
  const ref = await addDoc(collection(db, "resumes"), {
    ...data,
    paid:      true,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Get a user's resumes ───────────────────────────────────────────────
export async function getMyResumes(userId: string): Promise<Resume[]> {
  const snap = await getDocs(query(collection(db, "resumes"), where("userId", "==", userId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Resume));
  results.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return results;
}

export async function getResume(id: string): Promise<Resume | null> {
  const snap = await getDoc(doc(db, "resumes", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Resume;
}
