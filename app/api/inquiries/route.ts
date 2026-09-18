import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getService } from "@/lib/services/catalog";

export const runtime = "nodejs";

// Public: submit a service inquiry (lead) from a service detail page.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const serviceSlug = str("serviceSlug");
  const fullName = str("fullName");
  const phone = str("phone");
  const email = str("email");
  const message = str("message");
  const lang = str("lang") || "zh";

  if (!fullName) return NextResponse.json({ error: "missing_field", field: "fullName" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "missing_field", field: "phone" }, { status: 400 });

  const service = getService(serviceSlug);
  if (!service) return NextResponse.json({ error: "unknown_service" }, { status: 400 });

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // Store the localized service name so the admin list reads naturally.
  const serviceName = (lang === "en" ? service.en.name : service.zh.name);

  const inquiry = await prisma.inquiry.create({
    data: {
      serviceSlug,
      serviceName,
      fullName,
      phone,
      email: email || null,
      message: message || null,
      lang,
    },
  });

  return NextResponse.json({ id: inquiry.id }, { status: 201 });
}
