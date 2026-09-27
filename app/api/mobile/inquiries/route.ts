import { prisma } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile-auth";

// POST /api/mobile/inquiries — a service lead from the app (private doctor /
// longevity / sports-rehab / cross-border). Reuses the existing Inquiry model
// the web site and admin already use; tagged source="mobile". Auth optional —
// signed-in users get their email prefilled.
// Body: { serviceSlug, serviceName, fullName, phone, email?, message?, lang? }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: {
    serviceSlug?: string; serviceName?: string; fullName?: string;
    phone?: string; email?: string; message?: string; lang?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const fullName = (body.fullName ?? "").trim();
  const phone = (body.phone ?? "").trim();
  if (!fullName || !phone) {
    return Response.json({ error: "missing_name_or_phone" }, { status: 400 });
  }

  const user = await getMobileUser(req).catch(() => null);

  const inquiry = await prisma.inquiry.create({
    data: {
      serviceSlug: (body.serviceSlug ?? "general").trim(),
      serviceName: (body.serviceName ?? "General inquiry").trim(),
      fullName,
      phone,
      email: body.email?.trim() || user?.email || null,
      message: body.message?.trim() || null,
      lang: body.lang === "en" ? "en" : "zh",
      source: "mobile",
    },
  });
  return Response.json({ ok: true, id: inquiry.id }, { status: 201 });
}
