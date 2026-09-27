import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { saveUpload, isAllowed } from "@/lib/storage";
import { resolveBillingScope } from "@/lib/entitlements";

// GET  /api/mobile/consult — list the user's text-based (图文) consults.
// POST /api/mobile/consult — create a consult. multipart form:
//     topic (string), text (string), file (0..n images/pdf).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const consults = await prisma.consult.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { attachments: true } } },
  });
  return Response.json({ consults });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  // 医生在线沟通 is a pro/无忧/family entitlement — block free/basic.
  const scope = await resolveBillingScope(user);
  if (!scope.entitlements.doctorChat) {
    return Response.json({ error: "tier_required", feature: "doctorChat" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "expected_multipart_form" }, { status: 400 });
  }

  const topic = String(form.get("topic") ?? "").trim() || "Consultation";
  const text = String(form.get("text") ?? "").trim();
  if (!text) return Response.json({ error: "missing_text" }, { status: 400 });

  const files = form.getAll("file").filter((f): f is File => f instanceof File && isAllowed(f));

  const consult = await prisma.consult.create({
    data: {
      userId: user.id,
      topic,
      status: "new",
      messages: { create: { sender: "user", text } },
    },
    include: { messages: true },
  });

  const firstMsg = consult.messages[0];
  for (const file of files) {
    const saved = await saveUpload(`consult-${consult.id}`, file);
    await prisma.consultAttachment.create({
      data: {
        consultMsgId: firstMsg.id,
        originalName: saved.originalName,
        storedPath: saved.storedPath,
        mimeType: saved.mimeType,
        size: saved.size,
      },
    });
  }

  const full = await prisma.consult.findUnique({
    where: { id: consult.id },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { attachments: true } } },
  });
  return Response.json({ consult: full }, { status: 201 });
}
