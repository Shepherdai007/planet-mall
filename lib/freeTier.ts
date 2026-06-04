// lib/freeTier.ts
// ─── FREE TIER LIMITS (UPDATED) ──────────────────────────────────

export const FREE_TIER = {
  maxProducts:        10,     // 10 products
  maxConversations:   10,     // 10 message threads
  maxLivestreams:     0,      // no livestreaming
  marketplaceVisible: true,   // visible but lower ranking
  aiFeatures:         true,   // AI store builder included free
  aiProductDesc:      true,   // AI descriptions included free
  customDomain:       false,
  removeBranding:     false,
  analytics:          false,
  commission:         0.15,   // 15%
} as const;

export const PREMIUM_TIER = {
  maxProducts:        Infinity,
  maxConversations:   Infinity,
  maxLivestreams:     Infinity,
  marketplaceVisible: true,
  aiFeatures:         true,
  aiProductDesc:      true,
  customDomain:       true,
  removeBranding:     true,
  analytics:          true,
  commission:         0.08,   // 8%
} as const;

export const BUSINESS_TIER = {
  ...PREMIUM_TIER,
  commission: 0.05,           // 5%
} as const;

export function canAddProduct(currentCount: number, isPremium: boolean, isBusiness: boolean): boolean {
  if (isPremium || isBusiness) return true;
  return currentCount < FREE_TIER.maxProducts;
}

export function getUpgradeMessage(feature: string): string {
  const messages: Record<string, string> = {
    products:    "You've reached the 10 product limit on the free plan. Upgrade to Premium for unlimited products.",
    marketplace: "Upgrade to Premium for featured placement in the marketplace.",
    livestream:  "Livestreaming requires Premium. Upgrade for CA$14.99/month.",
    messaging:   "You've reached the conversation limit. Upgrade to Premium for unlimited messaging.",
  };
  return messages[feature] || "Upgrade to Premium to unlock this feature.";
}
