// pages/api/ai/build-resume.ts
// ─── AI RESUME CONTENT GENERATION ────────────────────────────────
// Takes raw questionnaire answers, returns polished resume content
// (summary, bullet points, skills) via Claude. PDF rendering happens
// in a separate step after this returns, once payment confirms.

import type { NextApiRequest, NextApiResponse } from "next";
import { callClaudeJSON } from "@/lib/ai";
import type { ResumeInput } from "@/services/resumeService";

interface GeneratedResume {
  summary:    string;
  experience: { title: string; company: string; duration: string; bullets: string[] }[];
  education:  { school: string; program: string; year: string }[];
  skills:     string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { input, targetJobDescription } = req.body as {
    input: ResumeInput;
    targetJobDescription?: string;   // optional — if tailoring for a specific job posting
  };

  if (!input?.fullName || !input?.targetJobTitle) {
    return res.status(400).json({ error: "Missing required resume input" });
  }

  const systemPrompt = `You are a professional resume writer. You take rough, informal notes from a job seeker and turn them into polished, professional resume content — the kind that passes applicant tracking systems and impresses hiring managers.

Rules:
- Write in third-person-free, achievement-focused language (no "I" or "me")
- Use strong action verbs (Led, Managed, Built, Increased, Reduced, Delivered)
- Quantify achievements wherever the input gives any hint of numbers, scale, or impact — invent nothing, but phrase what's given as impactfully as possible
- Keep each bullet point to one line, concise
- The summary should be 2-3 sentences, tailored toward the target job title
- Skills should be a clean list of 8-15 relevant, specific skills (not vague ones like "hard worker")
- If a target job description is provided, naturally weave in relevant keywords from it without sounding forced or fabricating experience the person doesn't have`;

  const prompt = `Build professional resume content for this person.

Full name: ${input.fullName}
Target job title: ${input.targetJobTitle}
Rough summary notes: ${input.summary || "(none provided — write a general professional summary based on their work history)"}

Work history (rough notes, polish these):
${input.workHistory.map((w, i) => `${i+1}. ${w.title} at ${w.company} (${w.duration})\n   Notes: ${w.highlights}`).join("\n")}

Education:
${input.education.map(e => `- ${e.program} at ${e.school} (${e.year})`).join("\n")}

Raw skills mentioned: ${input.skills}

${targetJobDescription ? `\nTailor this resume toward this specific job posting:\n${targetJobDescription}` : ""}

Return JSON with this exact shape:
{
  "summary": "string",
  "experience": [{ "title": "string", "company": "string", "duration": "string", "bullets": ["string", "string", "string"] }],
  "education": [{ "school": "string", "program": "string", "year": "string" }],
  "skills": ["string", "string", ...]
}`;

  try {
    const result = await callClaudeJSON<GeneratedResume>(prompt, systemPrompt, 2000);
    return res.status(200).json({ resume: result });
  } catch (err: any) {
    console.error("Resume generation error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate resume" });
  }
}
