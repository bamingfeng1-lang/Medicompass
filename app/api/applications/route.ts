import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveUpload, isAllowed, MAX_FILE_BYTES } from "@/lib/storage";
import { summarizeApplication } from "@/lib/ai";

export const runtime = "nodejs";

// Public: submit a second-opinion application with optional attachments.
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const str = (k: string) => (form.get(k)?.toString() ?? "").trim();
  const fullName = str("fullName");
  const email = str("email");
  const phone = str("phone");
  const country = str("country");
  const needType = str("needType");
  const destination = str("destination");
  const condition = str("condition");
  const lang = str("lang") || "zh";

  // Basic server-side validation.
  const missing = { fullName, email, phone, country, needType, condition };
  for (const [key, val] of Object.entries(missing)) {
    if (!val) return NextResponse.json({ error: "missing_field", field: key }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // Validate files before creating anything.
  const files = form.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "file_too_large", name: f.name }, { status: 400 });
    }
    if (!isAllowed(f)) {
      return NextResponse.json({ error: "file_type_not_allowed", name: f.name }, { status: 400 });
    }
  }

  const application = await prisma.application.create({
    data: {
      fullName,
      email,
      phone,
      country,
      needType,
      destination: destination || null,
      condition,
      lang,
      aiSummaryStatus: "pending",
    },
  });

  for (const f of files) {
    const saved = await saveUpload(application.id, f);
    await prisma.attachment.create({
      data: {
        applicationId: application.id,
        originalName: saved.originalName,
        storedPath: saved.storedPath,
        mimeType: saved.mimeType,
        size: saved.size,
      },
    });
  }

  // Fire-and-forget AI summarization; the admin UI can retry if it fails.
  void summarizeApplication(application.id);

  return NextResponse.json({ id: application.id }, { status: 201 });
}
