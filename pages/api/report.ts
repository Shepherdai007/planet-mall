// pages/api/report.ts
// ─── REPORT SUBMISSION API ───────────────────────────────────────
// Saves reports to Firestore /reports collection.
// Admins review from Firebase Console or future admin panel.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const {
    reporterId, reporterEmail,
    type,        // "seller" | "product" | "livestream" | "order"
    targetId,    // sellerId / productId / streamId / orderId
    targetName,
    reason,      // "scam" | "fake_product" | "no_delivery" | "misleading" | "inappropriate" | "other"
    description,
    evidence,    // optional URL or text
  } = req.body;

  if (!type || !targetId || !reason || !description) {
    return res.status(400).json({ error: "type, targetId, reason, and description are required" });
  }

  try {
    const ref = await adminDb.collection("reports").add({
      reporterId:    reporterId || "anonymous",
      reporterEmail: reporterEmail || "",
      type, targetId, targetName,
      reason, description, evidence,
      status:    "open",       // open → under_review → resolved → dismissed
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({ reportId: ref.id });
  } catch (err: any) {
    console.error("Report error:", err);
    return res.status(500).json({ error: "Failed to submit report" });
  }
}
