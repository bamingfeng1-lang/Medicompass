import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { resolveBillingScope, usageFor } from "@/lib/entitlements";

// GET /api/mobile/subscription — the user's current tier, active subscription,
// resolved entitlements, and this month's usage (for the "剩余 N 次" displays).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();
  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "active" },
    orderBy: { updatedAt: "desc" },
  });

  // Full purchase/renewal history (verify inserts one row per event).
  const records = await prisma.subscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const scope = await resolveBillingScope(user);
  const usage = await usageFor(scope);

  return Response.json({
    tier: user.tier,
    effectiveTier: scope.tier, // family tier when in a family, else own tier
    subscription: sub,
    records, // full history, newest first
    entitlements: scope.entitlements,
    usage, // { aiChats, reportPages } consumed this calendar month
  });
}
