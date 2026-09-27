import { prisma } from "@/lib/db";
import { generateInviteCode } from "@/lib/inviteCode";

// GET  /api/admin/patients — recent doctor-created patient profiles + invite state.
// POST /api/admin/patients — 医生建档 (场景A): create a login-less MobileUser
//      profile pre-loaded with a medication plan + follow-up tasks, and mint a
//      one-time PatientInvite code the patient redeems in-app to claim the plan.
// Protected by middleware (admin session cookie).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type MedInput = {
  nameEn?: string; nameZh?: string; dosage?: string;
  timingEn?: string; timingZh?: string; times?: unknown; stockDays?: number;
};
type TaskInput = {
  kind?: string; titleEn?: string; titleZh?: string;
  detailEn?: string; detailZh?: string; locationEn?: string; locationZh?: string; due?: string;
};

const TASK_KINDS = ["revisit", "recheck", "followUp", "rehab", "metricLog"];

function normTimes(raw: unknown): string {
  const arr = Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string") : [];
  return JSON.stringify(arr);
}

export async function GET(): Promise<Response> {
  const invites = await prisma.patientInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      mobileUser: {
        select: {
          id: true, name: true, email: true, appleUserId: true, createdAt: true,
          _count: { select: { medications: true, careTasks: true } },
        },
      },
    },
  });
  const patients = invites.map((inv) => ({
    id: inv.mobileUser.id,
    name: inv.mobileUser.name,
    claimed: !!(inv.mobileUser.email || inv.mobileUser.appleUserId),
    redeemedAt: inv.redeemedAt,
    expiresAt: inv.expiresAt,
    medications: inv.mobileUser._count.medications,
    careTasks: inv.mobileUser._count.careTasks,
    createdAt: inv.createdAt,
  }));
  return Response.json({ patients });
}

export async function POST(req: Request): Promise<Response> {
  let body: {
    name?: string; gender?: string; birthDate?: string; medicalHistory?: string;
    medications?: MedInput[]; careTasks?: TaskInput[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "missing_name" }, { status: 400 });

  const birthDate = body.birthDate ? new Date(body.birthDate) : null;
  const meds = Array.isArray(body.medications) ? body.medications : [];
  const tasks = Array.isArray(body.careTasks) ? body.careTasks : [];

  const { code, codeHash } = generateInviteCode();

  const patient = await prisma.mobileUser.create({
    data: {
      name,
      gender: body.gender ?? null,
      birthDate: birthDate && !isNaN(birthDate.getTime()) ? birthDate : null,
      medicalHistory: body.medicalHistory ?? null,
      profileCompleted: true,
      tier: "free",
      medications: {
        create: meds
          .filter((m) => (m.nameEn || m.nameZh))
          .map((m) => ({
            nameEn: (m.nameEn ?? m.nameZh ?? "").trim(),
            nameZh: (m.nameZh ?? m.nameEn ?? "").trim(),
            dosage: (m.dosage ?? "").trim(),
            timingEn: (m.timingEn ?? "").trim(),
            timingZh: (m.timingZh ?? "").trim(),
            times: normTimes(m.times),
            stockDays: typeof m.stockDays === "number" ? m.stockDays : 0,
          })),
      },
      careTasks: {
        create: tasks
          .filter((t) => (t.titleEn || t.titleZh) && t.due)
          .map((t) => ({
            kind: TASK_KINDS.includes(t.kind ?? "") ? (t.kind as string) : "followUp",
            titleEn: (t.titleEn ?? t.titleZh ?? "").trim(),
            titleZh: (t.titleZh ?? t.titleEn ?? "").trim(),
            detailEn: (t.detailEn ?? "").trim(),
            detailZh: (t.detailZh ?? "").trim(),
            locationEn: t.locationEn ?? null,
            locationZh: t.locationZh ?? null,
            due: new Date(t.due as string),
          })),
      },
      patientInvites: {
        create: { codeHash, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
      },
    },
  });

  return Response.json(
    { patient: { id: patient.id, name: patient.name }, code, expiresInDays: 30 },
    { status: 201 },
  );
}
