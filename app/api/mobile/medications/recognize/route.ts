import { resolveProfile, getMobileUser } from "@/lib/mobile-auth";
import { isAllowed } from "@/lib/storage";
import { resolveBillingScope, checkAndConsume, QuotaError, quotaExceeded } from "@/lib/entitlements";
import { hasActiveConsent, consentRequired } from "@/lib/consent";
import { recognizeMedication } from "@/lib/med-recognize";

// POST /api/mobile/medications/recognize — AI reads ONE medication box/label
// photo and returns a DRAFT to prefill the add-medication form. Stateless:
// nothing is persisted. Metered against reportPages (1/image), same "AI reading"
// entitlement as report interpretation / visit extraction. Manual add stays
// free — only this photo-recognition path consumes quota. Free tier
// (reportPages == 0) is rejected with a 402 upsell.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  // Cross-border consent is keyed to the operating account (the caller), since
  // recognition sends a health-related image to the (overseas) AI provider.
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
  const file = form
    .getAll("file")
    .find((f): f is File => f instanceof File && isAllowed(f) && /^image\/(png|jpeg|webp)$/.test(f.type));

  if (!file) {
    return Response.json({ error: "missing_file" }, { status: 400 });
  }

  const scope = await resolveBillingScope(user);
  try {
    await checkAndConsume(scope, "reportPages", 1);
  } catch (err) {
    if (err instanceof QuotaError) return quotaExceeded(err);
    throw err;
  }

  const image = { data: Buffer.from(await file.arrayBuffer()), mime: file.type, name: file.name };
  const draft = await recognizeMedication(image, locale);
  return Response.json({ draft }, { status: 200 });
}
