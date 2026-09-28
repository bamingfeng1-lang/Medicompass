import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// POST /api/mobile/medications/doses — log or clear a single dose for a day.
//   body: { medicationId, slot: "08:00", day?: "2026-09-26", taken: boolean }
// Idempotent: taken=true upserts a DoseLog, taken=false deletes it.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  let body: { medicationId?: string; slot?: string; day?: string; taken?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const medicationId = (body.medicationId ?? "").trim();
  const slot = (body.slot ?? "").trim();
  const day = (body.day ?? new Date().toISOString().slice(0, 10)).trim();
  if (!medicationId || !slot) {
    return Response.json({ error: "missing_medication_or_slot" }, { status: 400 });
  }

  // Ownership check — a user can only log doses for their own medications.
  const med = await prisma.mobileMedication.findFirst({
    where: { id: medicationId, userId: user.id },
    select: { id: true, quantity: true, unitsPerDose: true },
  });
  if (!med) return Response.json({ error: "not_found" }, { status: 404 });

  // Auto-decrement/restore stock, but only when the DoseLog actually changes so
  // repeated toggles stay idempotent (never double-count). Legacy meds with
  // unitsPerDose 0 leave quantity untouched.
  const perDose = Number.isFinite(med.unitsPerDose) ? med.unitsPerDose : 0;

  if (body.taken === false) {
    const del = await prisma.mobileDoseLog.deleteMany({ where: { medicationId, slot, day } });
    let quantity = med.quantity;
    if (del.count > 0 && perDose > 0) {
      quantity = Math.round(med.quantity + perDose);
      await prisma.mobileMedication.update({ where: { id: medicationId }, data: { quantity } });
    }
    return Response.json({ ok: true, taken: false, quantity });
  }

  const existing = await prisma.mobileDoseLog.findUnique({
    where: { medicationId_slot_day: { medicationId, slot, day } },
    select: { id: true },
  });
  let quantity = med.quantity;
  if (!existing) {
    await prisma.mobileDoseLog.create({
      data: { userId: user.id, medicationId, slot, day },
    });
    if (perDose > 0) {
      quantity = Math.max(0, Math.round(med.quantity - perDose));
      await prisma.mobileMedication.update({ where: { id: medicationId }, data: { quantity } });
    }
  }
  return Response.json({ ok: true, taken: true, quantity });
}
