import { prisma } from "@/lib/db";
import { entitlementsFor, type Entitlements } from "@/lib/products";
import type { MobileUser } from "@prisma/client";

// Quota resolution + enforcement. A "billing scope" is where usage is metered:
// the family (shared pool) for family-tier members, otherwise the user. Counters
// reset lazily via a YYYY-MM period key — a new month means a new counter row.

export type BillingScope = {
  scopeType: "user" | "family";
  scopeId: string;
  tier: string;
  entitlements: Entitlements;
};

export type QuotaKind = "aiChats" | "reportPages";

/** Thrown by checkAndConsume when a quota would be exceeded. */
export class QuotaError extends Error {
  constructor(
    public kind: QuotaKind,
    public limit: number,
    public used: number,
  ) {
    super(`quota_exceeded:${kind}`);
    this.name = "QuotaError";
  }
  get remaining(): number {
    return Math.max(0, this.limit - this.used);
  }
}

/** Current calendar-month period key, e.g. "2026-09". */
export function currentPeriod(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Resolve where a user's usage is metered and which entitlements apply. Family
 * members meter against the family (shared pool) at the family's tier; solo
 * users meter against themselves at their own tier.
 */
export async function resolveBillingScope(user: MobileUser): Promise<BillingScope> {
  if (user.familyId) {
    const family = await prisma.family.findUnique({ where: { id: user.familyId } });
    if (family) {
      return {
        scopeType: "family",
        scopeId: family.id,
        tier: family.tier,
        entitlements: entitlementsFor(family.tier),
      };
    }
  }
  return {
    scopeType: "user",
    scopeId: user.id,
    tier: user.tier,
    entitlements: entitlementsFor(user.tier),
  };
}

/** Read (creating if absent) the current-period counter for a scope. */
export async function getOrCreateCounter(scope: BillingScope, period = currentPeriod()) {
  return prisma.usageCounter.upsert({
    where: {
      scopeType_scopeId_period: { scopeType: scope.scopeType, scopeId: scope.scopeId, period },
    },
    update: {},
    create: { scopeType: scope.scopeType, scopeId: scope.scopeId, period },
  });
}

/** Current-period usage snapshot for a scope (no side effects). */
export async function usageFor(scope: BillingScope, period = currentPeriod()) {
  const counter = await prisma.usageCounter.findUnique({
    where: {
      scopeType_scopeId_period: { scopeType: scope.scopeType, scopeId: scope.scopeId, period },
    },
  });
  return { aiChats: counter?.aiChats ?? 0, reportPages: counter?.reportPages ?? 0 };
}

/**
 * Atomically check a quota and, if within limit, consume `amount`. Throws
 * QuotaError when the limit would be exceeded. The increment is conditional
 * (updateMany with a WHERE guard) so concurrent requests can't overshoot.
 */
export async function checkAndConsume(
  scope: BillingScope,
  kind: QuotaKind,
  amount = 1,
  period = currentPeriod(),
): Promise<void> {
  const limit = kind === "aiChats" ? scope.entitlements.aiQuota : scope.entitlements.reportPages;
  const counter = await getOrCreateCounter(scope, period);
  const used = kind === "aiChats" ? counter.aiChats : counter.reportPages;
  if (used + amount > limit) throw new QuotaError(kind, limit, used);

  // Conditional increment: only applies while still within limit.
  const res = await prisma.usageCounter.updateMany({
    where: {
      scopeType: scope.scopeType,
      scopeId: scope.scopeId,
      period,
      [kind]: { lte: limit - amount },
    },
    data: { [kind]: { increment: amount } },
  });
  if (res.count === 0) {
    const fresh = await getOrCreateCounter(scope, period);
    throw new QuotaError(kind, limit, kind === "aiChats" ? fresh.aiChats : fresh.reportPages);
  }
}

/** JSON 402 helper for quota-exceeded responses. */
export function quotaExceeded(err: QuotaError): Response {
  return Response.json(
    { error: "quota_exceeded", kind: err.kind, limit: err.limit, remaining: err.remaining },
    { status: 402 },
  );
}
