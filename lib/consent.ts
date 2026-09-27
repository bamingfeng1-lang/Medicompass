import { prisma } from "@/lib/db";

// Consent enforcement helpers (GDPR / PIPL 单独同意 for cross-border transfer).
//
// Consents are recorded per ACCOUNT (see app/api/mobile/consent/route.ts, which
// keys on getMobileUser). A "cross-border" consent authorizes transferring the
// user's personal health data outside their jurisdiction — which is exactly what
// the AI features do (the model provider is overseas). AI transfer points call
// `hasActiveConsent(caller.id, "crossborder")` and bail with `consentRequired`
// when it is absent or has been revoked.

/** True when the account has an active (accepted, not revoked) consent of `type`. */
export async function hasActiveConsent(userId: string, type: string): Promise<boolean> {
  const row = await prisma.consent.findFirst({
    where: { userId, type, accepted: true, revokedAt: null },
    select: { id: true },
  });
  return !!row;
}

/** 403 gate returned when a cross-border transfer lacks the required consent. */
export function consentRequired(type: string): Response {
  return Response.json({ error: "consent_required", consent: type }, { status: 403 });
}
