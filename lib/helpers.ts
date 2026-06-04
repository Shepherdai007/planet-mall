// lib/helpers.ts
// ─── SHARED UTILITY FUNCTIONS ───────────────────────────────────

import { format, formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";

// ── Currency formatting ───────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency: "CAD" | "USD" | "EUR" | "GBP" = "CAD"
): string {
  const locales: Record<string, string> = {
    CAD: "en-CA",
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
  };
  return new Intl.NumberFormat(locales[currency] || "en-CA", {
    style:    "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ── Firestore Timestamp → Date ────────────────────────────────────
export function toDate(ts: Timestamp | Date | null | undefined): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  return ts.toDate();
}

// ── Relative time ("2 hours ago") ────────────────────────────────
export function timeAgo(ts: Timestamp | Date | null | undefined): string {
  const d = toDate(ts);
  if (!d) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

// ── Format date string ────────────────────────────────────────────
export function formatDate(
  ts: Timestamp | Date | null | undefined,
  pattern = "MMM d, yyyy"
): string {
  const d = toDate(ts);
  if (!d) return "";
  return format(d, pattern);
}

// ── Slug from string ──────────────────────────────────────────────
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

// ── Truncate text ─────────────────────────────────────────────────
export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}

// ── Password strength (0–4) ───────────────────────────────────────
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8)           score++;
  if (password.length >= 12)          score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export const strengthLabel = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
export const strengthColor = [
  "#ef4444",  // red
  "#f97316",  // orange
  "#eab308",  // yellow
  "#22c55e",  // green
  "#16a34a",  // dark green
];

// ── Capitalize first letter ───────────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Generate random ID (for client-side temp IDs) ─────────────────
export function tempId(): string {
  return Math.random().toString(36).slice(2, 10);
}
