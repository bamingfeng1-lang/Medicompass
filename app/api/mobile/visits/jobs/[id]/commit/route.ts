import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeVisit } from "@/lib/visitShape";
import { commitJobVisits } from "@/lib/visitJobs";

// POST /api/mobile/visits/jobs/[id]/commit — turn the user's reviewed/edited
// drafts into real MobileVisit rows, attaching the job's photos by index, and
// mark the job reviewed. body: { visits: [{ visitType, patientName, hospital,
// department, doctor, visitDate, diagnosis, notes, imageIndexes[] }] }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  let createdIds: string[];
  try {
    createdIds = await commitJobVisits(user.id, params.id, body.visits);
  } catch (err) {
    if (err instanceof Error && err.message === "not_found") {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    throw err;
  }

  const visits = await prisma.mobileVisit.findMany({
    where: { id: { in: createdIds } },
    orderBy: { visitDate: "desc" },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  return Response.json({ visits: visits.map(shapeVisit) }, { status: 201 });
}
