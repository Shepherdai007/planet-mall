// pages/api/resume/generate-pdf.ts
// ─── RESUME PDF GENERATION ────────────────────────────────────────
// Renders the AI-polished resume content into a clean, professional
// PDF using pdf-lib, uploads it to Firebase Storage, returns the URL.
// Requires: npm install pdf-lib

import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { adminStorage } from "@/lib/firebase-admin";

interface GeneratedResume {
  summary:    string;
  experience: { title: string; company: string; duration: string; bullets: string[] }[];
  education:  { school: string; program: string; year: string }[];
  skills:     string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, fullName, email, phone, city, content } = req.body as {
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    city: string;
    content: GeneratedResume;
  };

  if (!userId || !fullName || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([612, 792]); // US Letter
    const margin = 56;
    const pageWidth = 612;
    let y = 792 - margin;

    const rustColor = rgb(0.77, 0.33, 0.10); // #C4531A
    const darkColor = rgb(0.10, 0.09, 0.08);
    const greyColor = rgb(0.54, 0.52, 0.50);

    function newPageIfNeeded(spaceNeeded: number) {
      if (y - spaceNeeded < margin) {
        page = pdfDoc.addPage([612, 792]);
        y = 792 - margin;
      }
    }

    function drawText(text: string, opts: { size?: number; font?: typeof fontRegular; color?: typeof darkColor; x?: number } = {}) {
      const size = opts.size || 10;
      const font = opts.font || fontRegular;
      const color = opts.color || darkColor;
      const x = opts.x ?? margin;
      newPageIfNeeded(size + 4);
      page.drawText(text, { x, y, size, font, color });
      y -= size + 4;
    }

    function wrapText(text: string, maxWidth: number, font: typeof fontRegular, size: number): string[] {
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) > maxWidth) {
          if (current) lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
      return lines;
    }

    // ── Header ──
    page.drawText(fullName, { x: margin, y, size: 22, font: fontBold, color: darkColor });
    y -= 28;
    const contactLine = [email, phone, city].filter(Boolean).join("   ·   ");
    page.drawText(contactLine, { x: margin, y, size: 10, font: fontRegular, color: greyColor });
    y -= 10;

    // Divider
    page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1.5, color: rustColor });
    y -= 24;

    // ── Summary ──
    if (content.summary) {
      page.drawText("PROFESSIONAL SUMMARY", { x: margin, y, size: 11, font: fontBold, color: rustColor });
      y -= 16;
      for (const line of wrapText(content.summary, pageWidth - margin * 2, fontRegular, 10)) {
        drawText(line, { size: 10 });
      }
      y -= 12;
    }

    // ── Experience ──
    if (content.experience?.length) {
      newPageIfNeeded(30);
      page.drawText("EXPERIENCE", { x: margin, y, size: 11, font: fontBold, color: rustColor });
      y -= 18;

      for (const job of content.experience) {
        newPageIfNeeded(50);
        page.drawText(job.title, { x: margin, y, size: 11, font: fontBold, color: darkColor });
        const durationWidth = fontRegular.widthOfTextAtSize(job.duration, 9);
        page.drawText(job.duration, { x: pageWidth - margin - durationWidth, y, size: 9, font: fontRegular, color: greyColor });
        y -= 14;
        page.drawText(job.company, { x: margin, y, size: 10, font: fontRegular, color: greyColor });
        y -= 16;

        for (const bullet of job.bullets || []) {
          const lines = wrapText(`•  ${bullet}`, pageWidth - margin * 2 - 10, fontRegular, 9.5);
          for (const line of lines) {
            newPageIfNeeded(14);
            page.drawText(line, { x: margin + 6, y, size: 9.5, font: fontRegular, color: darkColor });
            y -= 13;
          }
        }
        y -= 8;
      }
    }

    // ── Education ──
    if (content.education?.length) {
      newPageIfNeeded(30);
      page.drawText("EDUCATION", { x: margin, y, size: 11, font: fontBold, color: rustColor });
      y -= 18;

      for (const edu of content.education) {
        newPageIfNeeded(28);
        page.drawText(edu.program, { x: margin, y, size: 10, font: fontBold, color: darkColor });
        const yearWidth = fontRegular.widthOfTextAtSize(edu.year, 9);
        page.drawText(edu.year, { x: pageWidth - margin - yearWidth, y, size: 9, font: fontRegular, color: greyColor });
        y -= 14;
        page.drawText(edu.school, { x: margin, y, size: 9.5, font: fontRegular, color: greyColor });
        y -= 18;
      }
    }

    // ── Skills ──
    if (content.skills?.length) {
      newPageIfNeeded(40);
      page.drawText("SKILLS", { x: margin, y, size: 11, font: fontBold, color: rustColor });
      y -= 18;
      const skillsLine = content.skills.join("   •   ");
      for (const line of wrapText(skillsLine, pageWidth - margin * 2, fontRegular, 9.5)) {
        drawText(line, { size: 9.5 });
      }
    }

    const pdfBytes = await pdfDoc.save();

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const filePath = `resumes/${userId}/${Date.now()}_resume.pdf`;
    const file = bucket.file(filePath);
    await file.save(Buffer.from(pdfBytes), {
      metadata: { contentType: "application/pdf" },
    });
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return res.status(200).json({ url: publicUrl });
  } catch (err: any) {
    console.error("Resume PDF generation error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate PDF" });
  }
}
