import { prisma } from "@/lib/db";

// POST /api/admin/consult/[id]/reply  body: { text: string }
// A doctor's reply to a mobile 图文 consult. Protected by middleware (admin
// session cookie). Marks the consult "answered".

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  let body: {
    text?: string;
    doctorName?: string;
    doctorTitle?: string;
    doctorDept?: string;
    doctorLicense?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) return Response.json({ error: "missing_text" }, { status: 400 });

  const consult = await prisma.consult.findUnique({ where: { id: params.id } });
  if (!consult) return Response.json({ error: "not_found" }, { status: 404 });

  // Optional clinician disclosure — persist only non-empty values (never
  // fabricated); the mobile app renders whatever is present.
  const clean = (v?: string) => {
    const t = (v ?? "").trim();
    return t.length ? t : null;
  };

  await prisma.consultMessage.create({
    data: {
      consultId: consult.id,
      sender: "doctor",
      text,
      doctorName: clean(body.doctorName),
      doctorTitle: clean(body.doctorTitle),
      doctorDept: clean(body.doctorDept),
      doctorLicense: clean(body.doctorLicense),
    },
  });
  await prisma.consult.update({
    where: { id: consult.id },
    data: { status: "answered", updatedAt: new Date() },
  });
  return Response.json({ ok: true });
}
