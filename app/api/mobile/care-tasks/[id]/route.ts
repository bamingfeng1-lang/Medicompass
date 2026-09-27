import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// PATCH  /api/mobile/care-tasks/[id] — update completion.  body: { done: boolean }
// DELETE /api/mobile/care-tasks/[id] — remove a task.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ownedTask(userId: string, id: string) {
  return prisma.mobileCareTask.findFirst({ where: { id, userId }, select: { id: true } });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const { id } = params;
  if (!(await ownedTask(user.id, id))) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  let body: { done?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const task = await prisma.mobileCareTask.update({
    where: { id },
    data: { done: Boolean(body.done) },
  });
  return Response.json({
    task: {
      id: task.id,
      kind: task.kind,
      titleEn: task.titleEn,
      titleZh: task.titleZh,
      detailEn: task.detailEn,
      detailZh: task.detailZh,
      locationEn: task.locationEn,
      locationZh: task.locationZh,
      due: task.due,
      done: task.done,
    },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const { id } = params;
  if (!(await ownedTask(user.id, id))) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  await prisma.mobileCareTask.delete({ where: { id } });
  return Response.json({ ok: true });
}
