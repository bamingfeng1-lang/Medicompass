// StoreKit product id → app tier. Keep in sync with the iOS SubscriptionStore
// (tierForProduct) and Medicompass.storekit.
export const PRODUCT_TIER: Record<string, string> = {
  "com.medicomai.medicompass.plus.monthly": "plus",
  "com.medicomai.medicompass.pro.monthly": "pro",
  "com.medicomai.medicompass.concierge.monthly": "concierge",
  "com.medicomai.medicompass.family_basic.monthly": "family_basic",
  "com.medicomai.medicompass.family_concierge.monthly": "family_concierge",
};

// Per-tier entitlements — the single backend source of truth for gating.
// Quotas are per calendar month. reportPages 0 = report interpretation disabled.
// memberCap 1 = solo (no family). Keep the iOS SampleData.tiers copy in sync.
export type Entitlements = {
  aiQuota: number; // AI Q&A turns / month
  reportPages: number; // report-interpretation pages / month (0 = disabled)
  doctorChat: boolean; // 医生在线沟通 (consult)
  proactiveCare: boolean; // 主动关爱
  memberCap: number; // max profiles in the account (family size)
  family: boolean; // is a family (shared-pool) tier
};

export const TIER_ENTITLEMENTS: Record<string, Entitlements> = {
  free: { aiQuota: 3, reportPages: 0, doctorChat: false, proactiveCare: false, memberCap: 1, family: false },
  plus: { aiQuota: 20, reportPages: 10, doctorChat: false, proactiveCare: false, memberCap: 1, family: false },
  // 专业/无忧 report pages = 基础版 10 + 附加 10 = 20/月 (confirmed).
  pro: { aiQuota: 30, reportPages: 20, doctorChat: true, proactiveCare: false, memberCap: 1, family: false },
  concierge: { aiQuota: 30, reportPages: 20, doctorChat: true, proactiveCare: true, memberCap: 1, family: false },
  family_basic: { aiQuota: 100, reportPages: 100, doctorChat: true, proactiveCare: false, memberCap: 3, family: true },
  family_concierge: { aiQuota: 200, reportPages: 200, doctorChat: true, proactiveCare: true, memberCap: 7, family: true },
};

const FREE = TIER_ENTITLEMENTS.free;

/** Entitlements for a tier key, falling back to free for unknown keys. */
export function entitlementsFor(tier: string | null | undefined): Entitlements {
  return (tier && TIER_ENTITLEMENTS[tier]) || FREE;
}

/** True for the two family (shared-pool) tiers. */
export function isFamilyTier(tier: string | null | undefined): boolean {
  return entitlementsFor(tier).family;
}
