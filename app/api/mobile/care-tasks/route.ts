import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET  /api/mobile/care-tasks — the user's follow-up / re-exam / rehab tasks.
// POST /api/mobile/care-tasks — add a task.
//   body: { kind, titleEn, titleZh, detailEn?, detailZh?, locationEn?, locationZh?, due }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["revisit", "recheck", "followUp", "rehab", "metricLog"];

function shape(t: {
  id: string; kind: string; titleEn: string; titleZh: string;
  detailEn: string; detailZh: string; locationEn: string | null;
  locationZh: string | null; due: Date; done: boolean;
}) {
  return {
    id: t.id,
    kind: t.kind,
    titleEn: t.titleEn,
    titleZh: t.titleZh,
    detailEn: t.detailEn,
    detailZh: t.detailZh,
    locationEn: t.locationEn,
    locationZh: t.locationZh,
    due: t.due,
    done: t.done,
  };
}

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const tasks = await prisma.mobileCareTask.findMany({
    where: { userId: user.id },
    orderBy: { due: "asc" },
  });
  return Response.json({ tasks: tasks.map(shape) });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  let body: {
    kind?: string; titleEn?: string; titleZh?: string;
    detailEn?: string; detailZh?: string;
    locationEn?: string; locationZh?: string; due?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const kind = KINDS.includes(body.kind ?? "") ? body.kind! : "followUp";
  const titleEn = (body.titleEn ?? "").trim();
  const titleZh = (body.titleZh ?? "").trim();
  if (!titleEn && !titleZh) {
    return Response.json({ error: "missing_title" }, { status: 400 });
  }
  const due = body.due ? new Date(body.due) : new Date();
  if (Number.isNaN(due.getTime())) {
    return Response.json({ error: "invalid_due" }, { status: 400 });
  }

  const task = await prisma.mobileCareTask.create({
    data: {
      userId: user.id,
      kind,
      titleEn: titleEn || titleZh,
      titleZh: titleZh || titleEn,
      detailEn: (body.detailEn ?? "").trim(),
      detailZh: (body.detailZh ?? "").trim(),
      locationEn: body.locationEn?.trim() || null,
      locationZh: body.locationZh?.trim() || null,
      due,
    },
  });
  return Response.json({ task: shape(task) }, { status: 201 });
}
