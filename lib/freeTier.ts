// lib/freeTier.ts
// ─── FREE TIER LIMITS ────────────────────────────────────────────
// Single source of truth for what free users can and can't do.
// Check these BEFORE allowing actions in components and API routes.

export const FREE_TIER = {
  maxProducts:        1,    // 1 product only
  maxConversations:   3,    // 3 message threads
  maxLivestreams:     0,    // no livestreaming
  marketplaceVisible: false, // products hidden from Explore
  aiFeatures:         false, // no AI features
  customDomain:       false,
  removeBranding:     false,
  analytics:          false,
} as const;

export const PREMIUM_TIER = {
  maxProducts:        Infinity,
  maxConversations:   Infinity,
  maxLivestreams:     Infinity,
  marketplaceVisible: true,
  aiFeatures:         true,
  customDomain:       true,
  removeBranding:     true,
  analytics:          true,
} as const;

// ── Check if a seller can add more products ───────────────────────
export function canAddProduct(currentCount: number, isPremium: boolean): boolean {
  if (isPremium) return true;
  return currentCount < FREE_TIER.maxProducts;
}

// ── Get upgrade prompt message ────────────────────────────────────
export function getUpgradeMessage(feature: string): string {
  const messages: Record<string, string> = {
    products:    "You've reached the 1 product limit on the free plan. Upgrade to Premium for unlimited products.",
    marketplace: "Free stores aren't visible in the marketplace. Upgrade to Premium to get discovered by buyers.",
    ai:          "AI features are available on Premium. Upgrade for CA$9.99/month.",
    livestream:  "Livestreaming requires Premium. Upgrade to go live with your audience.",
    messaging:   "You've reached the 3 conversation limit. Upgrade to Premium for unlimited messaging.",
  };
  return messages[feature] || "Upgrade to Premium to unlock this feature.";
}
