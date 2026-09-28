import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeVisitJob } from "@/lib/visitJobs";

// GET    /api/mobile/visits/jobs/[id] — poll one job (status + drafts + files).
// DELETE /api/mobile/visits/jobs/[id] — dismiss/clear it (removes the bell item).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const job = await prisma.mobileVisitJob.findFirst({
    where: { id: params.id, userId: user.id },
    include: { files: { orderBy: { idx: "asc" } } },
  });
  if (!job) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ job: shapeVisitJob(job) });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const res = await prisma.mobileVisitJob.deleteMany({ where: { id: params.id, userId: user.id } });
  if (res.count === 0) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: true });
}
