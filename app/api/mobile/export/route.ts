import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET /api/mobile/export — returns ALL of the user's data as a JSON download
// (GDPR data portability). File metadata is included; raw file bytes are not.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  const [
    threads, reports, consults, subscriptions, devices,
    medications, doseLogs, careTasks, vitals, visits, wellnessPlans,
    consents, proactiveNotes, usageCounters, profileAudits, aiConfidenceLogs,
    adverseEventReports,
  ] = await Promise.all([
    prisma.chatThread.findMany({
      where: { userId: user.id },
      include: { turns: true },
    }),
    prisma.mobileReport.findMany({ where: { userId: user.id } }),
    prisma.consult.findMany({
      where: { userId: user.id },
      include: { messages: { include: { attachments: true } } },
    }),
    prisma.subscription.findMany({ where: { userId: user.id } }),
    prisma.mobileDevice.findMany({ where: { userId: user.id } }),
    prisma.mobileMedication.findMany({ where: { userId: user.id } }),
    prisma.mobileDoseLog.findMany({ where: { userId: user.id } }),
    prisma.mobileCareTask.findMany({ where: { userId: user.id } }),
    prisma.mobileVitalReading.findMany({ where: { userId: user.id } }),
    prisma.mobileVisit.findMany({
      where: { userId: user.id },
      include: { attachments: true },
    }),
    prisma.wellnessPlan.findMany({ where: { userId: user.id } }),
    prisma.consent.findMany({ where: { userId: user.id } }),
    prisma.proactiveNote.findMany({ where: { userId: user.id } }),
    prisma.usageCounter.findMany({ where: { scopeType: "user", scopeId: user.id } }),
    prisma.profileAudit.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.aiConfidenceLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.adverseEventReport.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  // Raw file bytes are never exported; strip on-disk paths, keep metadata.
  const stripPath = <T extends { storedPath?: unknown }>(row: T) => ({ ...row, storedPath: undefined });

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      familyId: user.familyId,
      familyRole: user.familyRole,
      // Medical profile (onboarding basics).
      gender: user.gender,
      birthDate: user.birthDate,
      bloodType: user.bloodType,
      allergies: user.allergies,
      medicalHistory: user.medicalHistory,
      profileCompleted: user.profileCompleted,
      createdAt: user.createdAt,
    },
    chatThreads: threads,
    reports: reports.map(stripPath),
    consults,
    subscriptions,
    devices: devices.map((d) => ({ ...d, apnsToken: "<redacted>" })),
    medications,
    doseLogs,
    careTasks,
    vitals,
    visits: visits.map((v) => ({ ...v, attachments: v.attachments.map(stripPath) })),
    wellnessPlans,
    consents,
    proactiveNotes,
    usageCounters,
    profileAudits: profileAudits.map((r) => ({
      ...r,
      changes: (() => { try { return JSON.parse(r.changes); } catch { return r.changes; } })(),
    })),
    aiConfidenceLogs: aiConfidenceLogs.map((r) => ({
      ...r,
      reasons: (() => { try { return JSON.parse(r.reasons); } catch { return r.reasons; } })(),
    })),
    adverseEventReports,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="medicompass-export-${user.id}.json"`,
    },
  });
}
