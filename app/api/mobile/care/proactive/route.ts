import Anthropic from "@anthropic-ai/sdk";
import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { resolveBillingScope } from "@/lib/entitlements";

// 主动关爱 (Proactive care) — a benefit of the 无忧 / 家庭无忧 tiers.
// GET  /api/mobile/care/proactive — recent 关爱 notes for the active profile.
// POST /api/mobile/care/proactive — generate a fresh AI check-in from the
//      profile's plan + records and store it as a ProactiveNote (source "ai").
// Tier-gated on entitlements.proactiveCare; others get 403 (iOS shows an upsell).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

function systemPrompt(zh: boolean): string {
  return zh
    ? `你是 Medicompass（迈缔康）的主动关爱助手，为签约「无忧」用户做每周健康关怀。
基于用户的用药计划、复诊安排、就诊与报告记录，用温暖、简洁的语气写一段主动关怀：
1) 先肯定与问候；2) 提醒本周需要注意的用药/复诊事项；3) 给 1-2 条可执行的小建议。
不超过 180 字，不臆测、不编造，末尾附一行「如有不适请及时联系医生」。`
    : `You are the Medicompass proactive-care assistant doing a weekly wellness check-in
for Worry-free members. Using the member's medication plan, follow-ups, visits and
reports, write a warm, concise note: (1) a caring greeting, (2) reminders for this
week's meds/follow-ups, (3) one or two actionable tips. Under 120 words, no
fabrication, ending with "Contact your doctor promptly if you feel unwell."`;
}

async function buildContext(userId: string, zh: boolean): Promise<string> {
  const [meds, tasks, visits, reports] = await Promise.all([
    prisma.mobileMedication.findMany({ where: { userId } }),
    prisma.mobileCareTask.findMany({ where: { userId, done: false }, orderBy: { due: "asc" }, take: 5 }),
    prisma.mobileVisit.findMany({ where: { userId }, orderBy: { visitDate: "desc" }, take: 3 }),
    prisma.mobileReport.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const lines: string[] = [];
  if (meds.length) {
    lines.push(zh ? "用药计划：" : "Medications:");
    for (const m of meds) lines.push(`- ${zh ? m.nameZh : m.nameEn} ${m.dosage} ${zh ? m.timingZh : m.timingEn} (${m.times})`);
  }
  if (tasks.length) {
    lines.push(zh ? "待办复诊/随访：" : "Upcoming follow-ups:");
    for (const t of tasks) lines.push(`- ${zh ? t.titleZh : t.titleEn} @ ${t.due.toISOString().slice(0, 10)}`);
  }
  if (visits.length) {
    lines.push(zh ? "近期就诊：" : "Recent visits:");
    for (const v of visits) lines.push(`- ${v.visitDate.toISOString().slice(0, 10)} ${v.diagnosis || v.hospital || ""}`);
  }
  if (reports.length) {
    lines.push(zh ? "近期报告：" : "Recent reports:");
    for (const r of reports) lines.push(`- ${r.category} ${r.aiStatus === "done" ? (r.aiInterpretation || "").replace(/\s+/g, " ").slice(0, 200) : ""}`);
  }
  return lines.join("\n") || (zh ? "（暂无记录）" : "(no records yet)");
}

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const scope = await resolveBillingScope(prof.profile);
  const notes = await prisma.proactiveNote.findMany({
    where: { userId: prof.profile.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return Response.json({
    eligible: scope.entitlements.proactiveCare,
    notes: notes.map((n) => ({ id: n.id, text: n.text, source: n.source, createdAt: n.createdAt })),
  });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const scope = await resolveBillingScope(user);
  if (!scope.entitlements.proactiveCare) {
    return Response.json({ error: "tier_required", feature: "proactiveCare" }, { status: 403 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Missing ANTHROPIC_API_KEY on the server." }, { status: 503 });
  }

  let locale = "zh";
  try {
    const body = (await req.json()) as { locale?: string };
    if (typeof body.locale === "string") locale = body.locale;
  } catch {
    // default zh
  }
  const zh = locale.startsWith("zh");

  const context = await buildContext(user.id, zh);
  const client = new Anthropic({ baseURL: process.env.ANTHROPIC_BASE_URL || undefined });
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: systemPrompt(zh),
    messages: [{ role: "user", content: (zh ? "以下是该用户的健康档案：\n" : "Here is the member's record:\n") + context }],
  });
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!text) return Response.json({ error: "generation_failed" }, { status: 502 });

  const note = await prisma.proactiveNote.create({
    data: { userId: user.id, text, source: "ai" },
  });
  return Response.json(
    { note: { id: note.id, text: note.text, source: note.source, createdAt: note.createdAt } },
    { status: 201 },
  );
}
