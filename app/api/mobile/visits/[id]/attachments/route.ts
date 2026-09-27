import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { saveUpload, isAllowed } from "@/lib/storage";
import { shapeVisit } from "@/lib/visitShape";

// POST /api/mobile/visits/[id]/attachments — add more reports / lab-sheet
// photos to an existing 就诊记录. multipart: file (1..n images/pdf).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "expected_multipart_form" }, { status: 400 });
  }
  const files = form.getAll("file").filter((f): f is File => f instanceof File && isAllowed(f));
  if (files.length === 0) {
    return Response.json({ error: "missing_file" }, { status: 400 });
  }

  for (const file of files) {
    const saved = await saveUpload(`visit-${visit.id}`, file);
    await prisma.mobileVisitAttachment.create({
      data: {
        visitId: visit.id,
        originalName: saved.originalName,
        storedPath: saved.storedPath,
        mimeType: saved.mimeType,
        size: saved.size,
      },
    });
  }

  const full = await prisma.mobileVisit.findUnique({
    where: { id: visit.id },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  return Response.json({ visit: full ? shapeVisit(full) : null }, { status: 201 });
}
