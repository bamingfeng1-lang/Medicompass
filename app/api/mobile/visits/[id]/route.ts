import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeVisit } from "@/lib/visitShape";

// GET    /api/mobile/visits/[id] — one 就诊记录 (with attachment metadata).
// DELETE /api/mobile/visits/[id] — delete it (cascades to attachment rows).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
