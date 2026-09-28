import { resolveProfile, getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { resolveBillingScope, checkAndConsume, QuotaError, quotaExceeded } from "@/lib/entitlements";
import { hasActiveConsent, consentRequired } from "@/lib/consent";
import { generateDiagnosticAdvice } from "@/lib/diagnostic-advice";

// AI 诊疗建议 (diagnostic advice) — manual-refresh AI reasoning over abnormal
// metrics + historical cases.
// POST /api/mobile/health-record/advice — consume 1 aiChats quota, create a
//      pending advice, generate fire-and-forget, return { advice }. Client polls GET.
// GET  /api/mobile/health-record/advice — the active profile's advices, newest first.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const advices = await prisma.diagnosticAdvice.findMany({
    where: { userId: prof.profile.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return Response.json({ advices });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  // Advice generation transfers the user's health data to the (overseas) AI
  // provider, so it requires an active cross-border consent on the operating account.
  const caller = await getMobileUser(req);
  if (caller && !(await hasActiveConsent(caller.id, "crossborder"))) {
    return consentRequired("crossborder");
  }

  // Advice generation is an AI feature — it draws on the monthly AI-consultation
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
  let abnormalContext: string | undefined;
  let healthContext: string | undefined;
  try {
    const body = (await req.json()) as { locale?: string; abnormalContext?: string; healthContext?: string };
    if (typeof body.locale === "string") locale = body.locale;
    if (typeof body.abnormalContext === "string") abnormalContext = body.abnormalContext;
    if (typeof body.healthContext === "string") healthContext = body.healthContext;
  } catch {
    // default zh, no context
  }

  const advice = await prisma.diagnosticAdvice.create({
    data: { userId: user.id, locale, status: "pending" },
  });

  // Fire-and-forget: generation writes back onto the row; client polls GET.
  void generateDiagnosticAdvice(advice.id, user.id, locale, abnormalContext, healthContext);

  return Response.json({ advice }, { status: 201 });
}
