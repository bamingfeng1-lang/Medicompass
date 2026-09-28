import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { normalizeMealTiming, shapeMedication as shape } from "@/lib/medications";

// GET  /api/mobile/medications  — the user's medication plan + which of today's
//                                 doses are already logged (local day via ?day=).
// POST /api/mobile/medications  — add a medication.
//   body: { nameEn, nameZh, dosage, timingEn, timingZh, times: string[], stockDays }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const url = new URL(req.url);
  const day = url.searchParams.get("day") ?? new Date().toISOString().slice(0, 10);

  const [meds, logs] = await Promise.all([
    prisma.mobileMedication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mobileDoseLog.findMany({
      where: { userId: user.id, day },
      select: { medicationId: true, slot: true },
    }),
  ]);

  return Response.json({
    medications: meds.map(shape),
    // keys "<medicationId>|<slot>" for doses already taken on `day`
    takenToday: logs.map((l) => `${l.medicationId}|${l.slot}`),
  });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  let body: {
    nameEn?: string; nameZh?: string; dosage?: string;
    timingEn?: string; timingZh?: string; times?: unknown; stockDays?: number;
    quantity?: number; unit?: string; unitsPerDose?: number;
    courseDays?: number; mealTiming?: string; barcode?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const nameEn = (body.nameEn ?? "").trim();
  const nameZh = (body.nameZh ?? "").trim();
  if (!nameEn && !nameZh) {
    return Response.json({ error: "missing_name" }, { status: 400 });
  }
  const times = Array.isArray(body.times) ? body.times.map(String) : [];

  const med = await prisma.mobileMedication.create({
    data: {
      userId: user.id,
      nameEn: nameEn || nameZh,
      nameZh: nameZh || nameEn,
      dosage: (body.dosage ?? "").trim(),
      timingEn: (body.timingEn ?? "").trim(),
      timingZh: (body.timingZh ?? "").trim(),
      times: JSON.stringify(times),
      stockDays: Number.isFinite(body.stockDays) ? Number(body.stockDays) : 0,
      quantity: Number.isFinite(body.quantity) ? Math.max(0, Math.trunc(Number(body.quantity))) : 0,
      unit: (body.unit ?? "").trim(),
      unitsPerDose: Number.isFinite(body.unitsPerDose) && Number(body.unitsPerDose) > 0 ? Number(body.unitsPerDose) : 1,
      courseDays: Number.isFinite(body.courseDays) ? Math.max(0, Math.trunc(Number(body.courseDays))) : 0,
      mealTiming: normalizeMealTiming(body.mealTiming),
      barcode: (body.barcode ?? "").trim(),
    },
  });

  return Response.json({ medication: shape(med) }, { status: 201 });
}
