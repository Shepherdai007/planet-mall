// pages/api/auth/check-otp.ts
// ─── TWILIO VERIFY — CHECK OTP ────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from "next";
import twilio from "twilio";
import { adminDb } from "@/lib/firebase-admin";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone, code, userId } = req.body;
  if (!phone || !code || !userId) {
    return res.status(400).json({ error: "Phone, code and userId required" });
  }

  try {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verificationChecks.create({ to: phone, code });

    if (result.status !== "approved") {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    // Save phone to user doc
    await adminDb.doc(`users/${userId}`).update({
      phone,
      phoneVerified: true,
      updatedAt: new Date(),
    });

    // Update trust profile
    try {
      await adminDb.doc(`trustProfiles/${userId}`).update({
        isPhoneVerified: true,
        updatedAt: new Date(),
      });
    } catch {}

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Twilio check OTP error:", err);
    return res.status(500).json({ error: err.message });
  }
}
