import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeMedication, normalizeMealTiming } from "@/lib/medications";

// PATCH  /api/mobile/medications/[id] — edit any plan field and/or refill quantity.
//   body: partial { nameEn, nameZh, dosage, timingEn, timingZh, times[], stockDays,
//                    quantity, unit, unitsPerDose, courseDays, mealTiming, barcode }
// DELETE /api/mobile/medications/[id] — remove a medication (cascades dose logs).
// Only fields present in the body are updated (refill = send just { quantity }).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ownedMed(userId: string, id: string) {
  return prisma.mobileMedication.findFirst({ where: { id, userId } });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const { id } = params;
  if (!(await ownedMed(user.id, id))) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  const str = (k: string) => {
    if (typeof body[k] === "string") data[k] = (body[k] as string).trim();
  };
  str("nameEn"); str("nameZh"); str("dosage");
  str("timingEn"); str("timingZh"); str("unit"); str("barcode");

  if (Array.isArray(body.times)) data.times = JSON.stringify(body.times.map(String));
  if (Number.isFinite(body.stockDays)) data.stockDays = Math.max(0, Math.trunc(Number(body.stockDays)));
  if (Number.isFinite(body.quantity)) data.quantity = Math.max(0, Math.trunc(Number(body.quantity)));
  if (Number.isFinite(body.unitsPerDose) && Number(body.unitsPerDose) > 0) data.unitsPerDose = Number(body.unitsPerDose);
  if (Number.isFinite(body.courseDays)) data.courseDays = Math.max(0, Math.trunc(Number(body.courseDays)));
  if (typeof body.mealTiming === "string") data.mealTiming = normalizeMealTiming(body.mealTiming);

  const updated = await prisma.mobileMedication.update({ where: { id }, data });
  return Response.json({ medication: shapeMedication(updated) });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const { id } = params;
  const res = await prisma.mobileMedication.deleteMany({ where: { id, userId: user.id } });
  if (res.count === 0) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: true });
}
