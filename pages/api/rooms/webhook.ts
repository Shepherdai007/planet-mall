// pages/api/rooms/webhook.ts
// ─── STRIPE WEBHOOK — ADD MEMBER AFTER PAYMENT ───────────────────

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { addMember } from "@/services/roomService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

export const config = { api: { bodyParser: false } };

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end",  ()    => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const sig     = req.headers["stripe-signature"] as string;
  const rawBody = await getRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_ROOMS_WEBHOOK_SECRET!);
  } catch {
    return res.status(400).json({ error: "Webhook signature failed" });
  }

  if (event.type === "checkout.session.completed") {
    const session  = event.data.object as Stripe.CheckoutSession;
    const { roomId, userId, userName, userPhoto } = session.metadata || {};

    if (roomId && userId) {
      await addMember(roomId, {
        userId,
        userName:        userName || "Member",
        userPhoto:       userPhoto || "",
        role:            "member",
        stripeSessionId: session.id,
      });
    }
  }

  res.json({ received: true });
}
