// lib/sendPush.ts
// ─── CLIENT-SIDE PUSH TRIGGER ─────────────────────────────────────
// Call this after sending a message, submitting an application,
// or any action that should notify another user.
// Calls the /api/notifications/send-push endpoint.

export async function sendPush({
  userId,
  title,
  body,
  url,
}: {
  userId:  string;
  title:   string;
  body:    string;
  url?:    string;
}): Promise<void> {
  try {
    await fetch("/api/notifications/send-push", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, title, body, url }),
    });
  } catch (err) {
    // Never block the UI if push fails
    console.error("Push send error:", err);
  }
}
