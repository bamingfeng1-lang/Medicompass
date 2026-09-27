import { resolveProfile, getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { resolveBillingScope, checkAndConsume, QuotaError, quotaExceeded } from "@/lib/entitlements";
import { hasActiveConsent, consentRequired } from "@/lib/consent";
import { generateWellnessPlan } from "@/lib/wellness-plan";

// 健康计划 (wellness plan) — AI diet + exercise plan from the health record.
// POST /api/mobile/health-record/plan — consume 1 aiChats quota, create a pending
//      plan, generate fire-and-forget, return { id, status }. Client polls GET.
// GET  /api/mobile/health-record/plan — the active profile's plans, newest first.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const plans = await prisma.wellnessPlan.findMany({
    where: { userId: prof.profile.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return Response.json({ plans });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  // Plan generation transfers the user's health data to the (overseas) AI provider,
  // so it requires an active cross-border consent on the operating account.
  const caller = await getMobileUser(req);
  if (caller && !(await hasActiveConsent(caller.id, "crossborder"))) {
    return consentRequired("crossborder");
  }

  // Plan generation is an AI feature — it draws on the monthly AI-consultation
  // quota (shared with chat), metered at the family scope for family tiers.
  const scope = await resolveBillingScope(user);
  try {
    await checkAndConsume(scope, "aiChats", 1);
  } catch (err) {
    if (err instanceof QuotaError) return quotaExceeded(err);
    throw err;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Missing ANTHROPIC_API_KEY on the server." }, { status: 503 });
  }

  let locale = "zh";
  let healthContext: string | undefined;
  try {
    const body = (await req.json()) as { locale?: string; healthContext?: string };
    if (typeof body.locale === "string") locale = body.locale;
    if (typeof body.healthContext === "string") healthContext = body.healthContext;
  } catch {
    // default zh, no snapshot
  }

  const plan = await prisma.wellnessPlan.create({
    data: { userId: user.id, locale, status: "pending" },
  });

  // Fire-and-forget: generation writes back onto the row; client polls GET.
  void generateWellnessPlan(plan.id, user.id, locale, healthContext);

  return Response.json({ plan }, { status: 201 });
}
