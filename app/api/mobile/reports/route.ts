import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { saveUpload, isAllowed } from "@/lib/storage";
import { interpretReport } from "@/lib/report-ai";
import { countReportPages } from "@/lib/pageCount";
import { resolveBillingScope, checkAndConsume, QuotaError, quotaExceeded } from "@/lib/entitlements";
import { resolvePdfUploads, parsePasswords } from "@/lib/pdf";

// GET  /api/mobile/reports        — list the user's reports (newest first)
// POST /api/mobile/reports        — multipart upload (field "file"), kicks off
//                                   AI interpretation, returns the new report.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shape(r: {
  id: string; originalName: string; mimeType: string; size: number; category: string;
  aiInterpretation: string | null; aiStatus: string; reviewed: boolean; createdAt: Date;
}) {
  return {
    id: r.id,
    originalName: r.originalName,
    mimeType: r.mimeType,
    size: r.size,
    category: r.category,
    aiInterpretation: r.aiInterpretation,
    aiStatus: r.aiStatus,
    reviewed: r.reviewed,
    createdAt: r.createdAt,
  };
}

const CATEGORIES = ["report", "lab", "imaging", "visit", "record"];

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const reports = await prisma.mobileReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ reports: reports.map(shape) });
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
  const file = form.get("file");
  const locale = String(form.get("locale") ?? "en");
  const categoryRaw = String(form.get("category") ?? "report");
  const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : "report";
  if (!(file instanceof File)) {
    return Response.json({ error: "missing_file" }, { status: 400 });
  }
  if (!isAllowed(file)) {
    return Response.json({ error: "unsupported_or_too_large" }, { status: 415 });
  }

  // Screen an encrypted PDF BEFORE metering: decrypt in place given the right
  // password, else 409 without storing the report or consuming quota.
  const gate = await resolvePdfUploads([file], parsePasswords(form));
  if (!gate.ok) {
    return Response.json({ error: gate.error, fileNames: gate.fileNames }, { status: 409 });
  }
  const effectiveFile = gate.files[0];

  // Report-interpretation entitlement + monthly page quota. Free tier has 0
  // pages → the report is still stored, but AI interpretation is locked. Other
  // tiers consume `pages` from the (shared, for family) monthly pool; 402 over.
  const scope = await resolveBillingScope(user);
  const pages = await countReportPages(effectiveFile);
  const canInterpret = scope.entitlements.reportPages > 0;
  if (canInterpret) {
    try {
      await checkAndConsume(scope, "reportPages", pages);
    } catch (err) {
      if (err instanceof QuotaError) return quotaExceeded(err);
      throw err;
    }
  }

  const saved = await saveUpload(`report-${user.id}`, effectiveFile);
  const report = await prisma.mobileReport.create({
    data: {
      userId: user.id,
      originalName: saved.originalName,
      storedPath: saved.storedPath,
      mimeType: saved.mimeType,
      size: saved.size,
      category,
      aiStatus: canInterpret ? "pending" : "locked",
    },
  });

  // Fire-and-forget AI interpretation; the client polls GET /reports/[id].
  // Free tier skips it (aiStatus "locked" → the app shows an upsell).
  if (canInterpret) void interpretReport(report.id, locale);

  return Response.json({ report: shape(report) }, { status: 201 });
}
