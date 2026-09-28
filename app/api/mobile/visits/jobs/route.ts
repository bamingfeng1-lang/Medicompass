import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeVisitJob } from "@/lib/visitJobs";

// GET /api/mobile/visits/jobs — the user's AI extraction jobs (newest first).
// Drives the Home bell: unread = status "done" && !reviewed. Also surfaces
// "failed" jobs so the user can retry.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const jobs = await prisma.mobileVisitJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { files: { orderBy: { idx: "asc" } } },
  });
  return Response.json({ jobs: jobs.map(shapeVisitJob) });
}
