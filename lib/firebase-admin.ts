// lib/firebase-admin.ts
// ─── SERVER-SIDE FIREBASE ADMIN ─────────────────────────────────
// NEVER import this in pages/ or components/ directly.
// Only use inside /pages/api/ routes or Cloud Functions.
// Admin bypasses Firestore security rules — treat with care.

import * as admin from "firebase-admin";

function getAdminApp(): admin.app.App {
  if (admin.apps.length) return admin.apps[0]!;

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      // Env vars encode \n as \\n — restore real newlines
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

const adminApp  = getAdminApp();
const adminAuth = admin.auth(adminApp);
const adminDb   = admin.firestore(adminApp);

export { adminApp, adminAuth, adminDb };
