import { prisma } from "@/lib/db";
import { pushToUser } from "@/lib/push";

// POST /api/admin/care  body: { userId: string, text: string }
// The care team pushes a 主动关爱 note to a member (场景C/E). Stores a
// ProactiveNote (source "team") and best-effort pushes to the member's devices.
// Protected by middleware (admin session cookie).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: { userId?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const userId = (body.userId ?? "").trim();
  const text = (body.text ?? "").trim();
  if (!userId || !text) return Response.json({ error: "missing_fields" }, { status: 400 });

  const user = await prisma.mobileUser.findUnique({ where: { id: userId } });
  if (!user) return Response.json({ error: "not_found" }, { status: 404 });

  const note = await prisma.proactiveNote.create({
    data: { userId, text, source: "team" },
  });

  const delivered = await pushToUser(userId, {
    title: "来自关爱团队 · Care team",
    body: text.slice(0, 160),
    data: { kind: "proactiveNote", noteId: note.id },
  });

  return Response.json({ ok: true, noteId: note.id, delivered });
}
