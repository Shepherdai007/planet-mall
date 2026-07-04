// pages/api/auth/send-otp.ts
// ─── TWILIO VERIFY — SEND OTP ─────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from "next";
import Twilio from "twilio";

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verifications.create({ to: phone, channel: "sms" });

    return res.status(200).json({ status: verification.status });
  } catch (err: any) {
    console.error("Twilio send OTP error:", err);
    return res.status(500).json({ error: err.message });
  }
}
