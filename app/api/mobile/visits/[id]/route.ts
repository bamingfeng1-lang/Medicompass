import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeVisit } from "@/lib/visitShape";

// GET    /api/mobile/visits/[id] — one 就诊记录 (with attachment metadata).
// PATCH  /api/mobile/visits/[id] — edit its structured fields.
// DELETE /api/mobile/visits/[id] — delete it (cascades to attachment rows).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISIT_TYPES = ["outpatient", "emergency", "inpatient", "checkup", "other"];

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const visit = await prisma.mobileVisit.findFirst({
    where: { id: params.id, userId: user.id },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  if (!visit) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ visit: shapeVisit(visit) });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const existing = await prisma.mobileVisit.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return Response.json({ error: "not_found" }, { status: 404 });

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
  str("patientName"); str("hospital"); str("department");
  str("doctor"); str("diagnosis"); str("notes");
  if (typeof body.visitType === "string" && VISIT_TYPES.includes(body.visitType)) {
    data.visitType = body.visitType;
  }
  if (typeof body.visitDate === "string") {
    const d = new Date(body.visitDate);
    if (!isNaN(d.getTime())) data.visitDate = d;
  }

  await prisma.mobileVisit.update({ where: { id: existing.id }, data });
  const full = await prisma.mobileVisit.findUnique({
    where: { id: existing.id },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  return Response.json({ visit: full ? shapeVisit(full) : null });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const visit = await prisma.mobileVisit.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!visit) return Response.json({ error: "not_found" }, { status: 404 });

  await prisma.mobileVisit.delete({ where: { id: visit.id } });
  return Response.json({ ok: true });
}
