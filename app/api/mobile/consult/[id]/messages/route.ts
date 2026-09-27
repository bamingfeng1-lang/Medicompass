import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { saveUpload, isAllowed } from "@/lib/storage";
import { resolveBillingScope } from "@/lib/entitlements";

// POST /api/mobile/consult/[id]/messages — append a user message (+ optional
// image/pdf attachments) to an existing consult. multipart: text, file (0..n).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  // 医生在线沟通 is a pro/无忧/family entitlement — block a user who has since
  // downgraded off a doctorChat tier from posting into an existing consult.
  const scope = await resolveBillingScope(user);
  if (!scope.entitlements.doctorChat) {
    return Response.json({ error: "tier_required", feature: "doctorChat" }, { status: 403 });
  }

  const consult = await prisma.consult.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!consult) return Response.json({ error: "not_found" }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "expected_multipart_form" }, { status: 400 });
  }
  const text = String(form.get("text") ?? "").trim();
  if (!text) return Response.json({ error: "missing_text" }, { status: 400 });
  const files = form.getAll("file").filter((f): f is File => f instanceof File && isAllowed(f));

  const message = await prisma.consultMessage.create({
    data: { consultId: consult.id, sender: "user", text },
  });
  for (const file of files) {
    const saved = await saveUpload(`consult-${consult.id}`, file);
    await prisma.consultAttachment.create({
      data: {
        consultMsgId: message.id,
        originalName: saved.originalName,
        storedPath: saved.storedPath,
        mimeType: saved.mimeType,
        size: saved.size,
      },
    });
  }
  // A new user message re-opens the consult for the doctor.
  await prisma.consult.update({
    where: { id: consult.id },
    data: { status: "new", updatedAt: new Date() },
  });

  const full = await prisma.consult.findUnique({
    where: { id: consult.id },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { attachments: true } } },
  });
  return Response.json({ consult: full }, { status: 201 });
}
