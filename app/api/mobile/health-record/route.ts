import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET /api/mobile/health-record — the aggregated 健康档案 (health record) for the
// active profile: 基础信息 + 就诊记录(门诊/住院) + 报告解读 + 指标. Read-only, no AI.
// Apple Health metrics are NOT stored server-side; the client sends a transient
// snapshot when generating a plan (see ./plan). Supports family X-Profile-Id.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const [visits, reports, vitals, medications] = await Promise.all([
    prisma.mobileVisit.findMany({
      where: { userId: user.id },
      orderBy: { visitDate: "desc" },
      take: 20,
      include: { attachments: { select: { id: true } } },
    }),
    prisma.mobileReport.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.mobileVitalReading.findMany({
      where: { userId: user.id },
      orderBy: { measuredAt: "desc" },
      take: 60,
    }),
    prisma.mobileMedication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return Response.json({
    profile: {
      name: user.name,
      gender: user.gender,
      birthDate: user.birthDate,
      bloodType: user.bloodType,
      allergies: user.allergies,
      medicalHistory: user.medicalHistory,
    },
    visits: visits.map((v) => ({
      id: v.id,
      visitType: v.visitType,
      hospital: v.hospital,
      department: v.department,
      doctor: v.doctor,
      visitDate: v.visitDate,
      diagnosis: v.diagnosis,
      notes: v.notes,
      attachmentCount: v.attachments.length,
      createdAt: v.createdAt,
    })),
    reports: reports.map((r) => ({
      id: r.id,
      originalName: r.originalName,
      category: r.category,
      aiInterpretation: r.aiInterpretation,
      aiStatus: r.aiStatus,
      createdAt: r.createdAt,
    })),
    vitals: vitals.map((r) => ({
      id: r.id,
      kind: r.kind,
      value: r.value,
      secondary: r.secondary,
      measuredAt: r.measuredAt,
    })),
    medications: medications.map((m) => ({
      id: m.id,
      nameEn: m.nameEn,
      nameZh: m.nameZh,
      dosage: m.dosage,
      timingEn: m.timingEn,
      timingZh: m.timingZh,
    })),
  });
}
