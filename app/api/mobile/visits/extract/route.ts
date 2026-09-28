import { resolveProfile, getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { saveUpload, isAllowed } from "@/lib/storage";
import { resolveBillingScope, checkAndConsume, QuotaError, quotaExceeded } from "@/lib/entitlements";
import { hasActiveConsent, consentRequired } from "@/lib/consent";
import { runVisitExtractJob } from "@/lib/visit-extract-job";
import { shapeVisitJob } from "@/lib/visitJobs";
import { resolvePdfUploads, parsePasswords } from "@/lib/pdf";

// POST /api/mobile/visits/extract — start a BACKGROUND AI extraction job. The
// batch of visit/report photos is persisted to a MobileVisitJob, extraction runs
// fire-and-forget (client polls GET /visits/jobs/[id] or sees the Home bell), and
// on completion the user reviews/edits the drafts and commits them into real
// visits. Consent + metering are enforced UP FRONT (free tier → 402, no consent →
// 403) so nothing is queued that the user isn't entitled to. Metered against
// reportPages (1/image), same "AI reading" entitlement as report interpretation.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  // Cross-border consent is keyed to the operating account (the caller), since
  // extraction sends health images to the (overseas) AI provider.
  const caller = await getMobileUser(req);
  if (caller && !(await hasActiveConsent(caller.id, "crossborder"))) {
    return consentRequired("crossborder");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "expected_multipart_form" }, { status: 400 });
  }

  const locale = String(form.get("locale") ?? "en");
  const files = form
    .getAll("file")
    .filter((f): f is File => f instanceof File && isAllowed(f)
      && /^(image\/(png|jpeg|webp)|application\/pdf)$/.test(f.type));

  if (files.length === 0) {
    return Response.json({ error: "missing_file" }, { status: 400 });
  }

  // Screen encrypted PDFs BEFORE metering: password-protected files are
  // decrypted in place (given the right password) or, failing that, 409'd
  // without creating a job or consuming quota.
  const gate = await resolvePdfUploads(files, parsePasswords(form));
  if (!gate.ok) {
    return Response.json({ error: gate.error, fileNames: gate.fileNames }, { status: 409 });
  }
  const effectiveFiles = gate.files;

  const scope = await resolveBillingScope(user);
  try {
    await checkAndConsume(scope, "reportPages", effectiveFiles.length);
  } catch (err) {
    if (err instanceof QuotaError) return quotaExceeded(err);
    throw err;
  }

  // Persist the job + its photos, then kick off extraction in the background.
  const job = await prisma.mobileVisitJob.create({
    data: { userId: user.id, locale, status: "pending", fileCount: effectiveFiles.length },
  });
  let idx = 0;
  for (const file of effectiveFiles) {
    const saved = await saveUpload(`visit-job-${job.id}`, file);
    await prisma.mobileVisitJobFile.create({
      data: {
        jobId: job.id,
        idx,
        storedPath: saved.storedPath,
        mimeType: saved.mimeType,
        size: saved.size,
        originalName: saved.originalName,
      },
    });
    idx++;
  }

  void runVisitExtractJob(job.id);

  const full = await prisma.mobileVisitJob.findUnique({
    where: { id: job.id },
    include: { files: { orderBy: { idx: "asc" } } },
  });
  return Response.json({ job: full ? shapeVisitJob(full) : null }, { status: 202 });
}
