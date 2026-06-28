// pages/api/notifications/send-push.ts
// ─── SEND PUSH NOTIFICATION ───────────────────────────────────────
// Called server-side whenever a message, order update, insurance
// lead, or job application comes in. Looks up the user's FCM token
// and sends a push via Firebase Admin SDK.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, title, body, url, imageUrl } = req.body;
  if (!userId || !title || !body) {
    return res.status(400).json({ error: "userId, title, and body required" });
  }

  try {
    // Get user's FCM token
    const tokenDoc = await adminDb.doc(`fcmTokens/${userId}`).get();
    if (!tokenDoc.exists) {
      return res.status(200).json({ sent: false, reason: "No FCM token for user" });
    }

    const { token } = tokenDoc.data()!;

    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      webpush: {
        notification: {
          title,
          body,
          icon: "/logo.png",
          badge: "/logo.png",
          vibrate: [200, 100, 200],
          data: { url: url || "https://planetmallshop.com" },
        },
        fcmOptions: {
          link: url || "https://planetmallshop.com",
        },
      },
      data: { url: url || "https://planetmallshop.com" },
    };

    await admin.messaging().send(message);
    return res.status(200).json({ sent: true });
  } catch (err: any) {
    // Token expired or invalid — clean it up
    if (err.code === "messaging/registration-token-not-registered") {
      await adminDb.doc(`fcmTokens/${userId}`).delete().catch(() => {});
      return res.status(200).json({ sent: false, reason: "Token expired, cleaned up" });
    }
    console.error("Push notification error:", err);
    return res.status(500).json({ error: err.message });
  }
}
