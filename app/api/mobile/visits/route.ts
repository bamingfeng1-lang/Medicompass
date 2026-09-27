import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { saveUpload, isAllowed } from "@/lib/storage";
import { shapeVisit } from "@/lib/visitShape";

// GET  /api/mobile/visits — list the user's 就诊记录 (newest first).
// POST /api/mobile/visits — create one. multipart form:
//     visitType, hospital, department, doctor, visitDate (ISO/yyyy-MM-dd),
//     diagnosis, notes, file (0..n images/pdf — reports / lab-sheet photos).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISIT_TYPES = ["outpatient", "emergency", "inpatient", "checkup", "other"];

function parseVisitDate(raw: string): Date {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const visits = await prisma.mobileVisit.findMany({
    where: { userId: user.id },
    orderBy: { visitDate: "desc" },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  return Response.json({ visits: visits.map(shapeVisit) });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "expected_multipart_form" }, { status: 400 });
  }

  const visitTypeRaw = String(form.get("visitType") ?? "outpatient");
  const visitType = VISIT_TYPES.includes(visitTypeRaw) ? visitTypeRaw : "outpatient";
  const hospital = String(form.get("hospital") ?? "").trim();
  const department = String(form.get("department") ?? "").trim();
  const doctor = String(form.get("doctor") ?? "").trim();
  const diagnosis = String(form.get("diagnosis") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const visitDate = parseVisitDate(String(form.get("visitDate") ?? ""));

  const files = form.getAll("file").filter((f): f is File => f instanceof File && isAllowed(f));

  const visit = await prisma.mobileVisit.create({
    data: { userId: user.id, visitType, hospital, department, doctor, diagnosis, notes, visitDate },
  });

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
