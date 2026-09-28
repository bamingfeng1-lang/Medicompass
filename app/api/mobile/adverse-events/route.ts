import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET  /api/mobile/adverse-events  — the caller/active-profile's own safety reports
// POST /api/mobile/adverse-events  — file a new report
//   body: { kind, severity?, description, relatedTurnId?, relatedMedication?, locale? }
//
// Patient safety reporting (合规：不良事件上报). Covers a suspected adverse event, a
// drug reaction, or a harmful/incorrect AI answer. Deliberately NOT tier- or
// consent-gated — blocking a safety report is the wrong failure mode. `description`
// is field-encrypted at rest (lib/crypto-field.ts). Uses resolveProfile so a
// caregiver may file on behalf of a managed family profile (X-Profile-Id).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["ai-error", "drug-reaction", "adverse-event"];
const SEVERITIES = ["mild", "moderate", "severe", "unknown"];

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;

  const reports = await prisma.adverseEventReport.findMany({
    where: { userId: prof.profile.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ reports });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;

  let body: {
    kind?: string;
    severity?: string;
    description?: string;
    relatedTurnId?: string;
    relatedMedication?: string;
    locale?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const kind = typeof body.kind === "string" && KINDS.includes(body.kind) ? body.kind : null;
  if (!kind) return Response.json({ error: "invalid_kind" }, { status: 400 });

  const severity =
    typeof body.severity === "string" && SEVERITIES.includes(body.severity)
      ? body.severity
      : "unknown";

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) return Response.json({ error: "description_required" }, { status: 400 });

  const relatedTurnId =
    typeof body.relatedTurnId === "string" && body.relatedTurnId ? body.relatedTurnId : null;
  const relatedMedication =
    typeof body.relatedMedication === "string" && body.relatedMedication.trim()
      ? body.relatedMedication.trim()
      : null;
  const locale = body.locale === "en" ? "en" : "zh";

  const report = await prisma.adverseEventReport.create({
    data: {
      userId: prof.profile.id,
      kind,
      severity,
      description,
      relatedTurnId,
      relatedMedication,
      locale,
    },
  });

  return Response.json({ ok: true, id: report.id }, { status: 201 });
}
