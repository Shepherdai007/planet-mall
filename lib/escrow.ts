// lib/escrow.ts
// ─── ESCROW RULES PER CATEGORY ───────────────────────────────────
// Different product categories have different escrow release rules.
// Food & Restaurant: instant release (2hr auto-release)
// All others: 14-day auto-release

export type SellerCategory = "food" | "standard";

export const ESCROW_RULES = {
  food: {
    autoReleaseHours: 2,      // 2 hours after delivery confirmation
    label:            "Food order",
    description:      "Payment released instantly when you confirm receipt.",
    instantRelease:   true,
  },
  standard: {
    autoReleaseHours: 336,    // 14 days
    label:            "Standard order",
    description:      "Payment held for 14 days. Released when you confirm delivery.",
    instantRelease:   false,
  },
} as const;

// ── Food categories ───────────────────────────────────────────────
export const FOOD_CATEGORIES = [
  "Food & Beverages",
  "Restaurant & Takeout",
  "Ready-Made Meals",
  "Catering",
  "Bakery & Pastry",
  "Groceries",
];

export function isFoodOrder(category: string): boolean {
  return FOOD_CATEGORIES.includes(category);
}

export function getEscrowRule(category: string) {
  return isFoodOrder(category) ? ESCROW_RULES.food : ESCROW_RULES.standard;
}

// ── Commission rates ──────────────────────────────────────────────
export const COMMISSION_RATES = {
  free:     0.15,  // 15%
  premium:  0.08,  // 8%
  business: 0.05,  // 5%
} as const;

export function getCommissionRate(plan: string): number {
  return COMMISSION_RATES[plan as keyof typeof COMMISSION_RATES] || COMMISSION_RATES.free;
}

export function calculatePayout(total: number, plan: string): {
  commission: number;
  payout: number;
  rate: number;
} {
  const rate       = getCommissionRate(plan);
  const commission = total * rate;
  const payout     = total - commission;
  return { commission, payout, rate };
}
