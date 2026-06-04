// pages/api/agora-token.ts
// ─── AGORA TOKEN GENERATOR ───────────────────────────────────────
// Generates a short-lived RTC token for a given channel.
// Called by the livestream pages before joining Agora.
// NEVER expose AGORA_APP_CERTIFICATE to the client.

import type { NextApiRequest, NextApiResponse } from "next";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { channelName, uid, role } = req.body;

  if (!channelName) {
    return res.status(400).json({ error: "channelName is required" });
  }

  const appId       = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const certificate = process.env.AGORA_APP_CERTIFICATE!;

  if (!appId || !certificate) {
    return res.status(500).json({ error: "Agora credentials not configured" });
  }

  // Token expires in 1 hour (3600 seconds)
  const expireTime   = 3600;
  const currentTime  = Math.floor(Date.now() / 1000);
  const privilegeExpire = currentTime + expireTime;

  const rtcRole = role === "host" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      certificate,
      channelName,
      uid || 0,
      rtcRole,
      privilegeExpire,
      privilegeExpire
    );
    return res.status(200).json({ token });
  } catch (err: any) {
    console.error("Token generation error:", err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
}
