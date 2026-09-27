import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { hashInviteCode } from "@/lib/inviteCode";

// POST /api/mobile/invite/redeem  body: { code }
// 场景A: a patient who signed up in-app (email/Apple) redeems the doctor's
// onboarding code. The doctor-created placeholder profile carries a medication
// plan + follow-up tasks; we move that content onto the caller's real account
// and retire the placeholder, so the patient immediately sees their plan.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) return Response.json({ error: "missing_code" }, { status: 400 });

  const invite = await prisma.patientInvite.findFirst({
    where: { codeHash: hashInviteCode(code), redeemedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!invite) return Response.json({ error: "invalid_or_expired_code" }, { status: 404 });

  const placeholder = await prisma.mobileUser.findUnique({ where: { id: invite.mobileUserId } });
  if (!placeholder) return Response.json({ error: "invalid_or_expired_code" }, { status: 404 });

  // Guard: a placeholder is login-less. If somehow it already carries an
  // identity (already claimed), or the caller *is* the placeholder, reject.
  if (placeholder.id === user.id) {
    return Response.json({ error: "already_own_profile" }, { status: 409 });
  }
  if (placeholder.email || placeholder.appleUserId) {
    return Response.json({ error: "already_redeemed" }, { status: 409 });
  }

  const target = user.id;
  const src = placeholder.id;

  await prisma.$transaction([
    prisma.mobileMedication.updateMany({ where: { userId: src }, data: { userId: target } }),
    prisma.mobileDoseLog.updateMany({ where: { userId: src }, data: { userId: target } }),
    prisma.mobileCareTask.updateMany({ where: { userId: src }, data: { userId: target } }),
    prisma.mobileReport.updateMany({ where: { userId: src }, data: { userId: target } }),
    prisma.mobileVisit.updateMany({ where: { userId: src }, data: { userId: target } }),
    prisma.mobileVitalReading.updateMany({ where: { userId: src }, data: { userId: target } }),
    // Fill in profile basics the patient hasn't set yet, from the doctor's record.
    prisma.mobileUser.update({
      where: { id: target },
      data: {
        name: user.name ?? placeholder.name,
        gender: user.gender ?? placeholder.gender,
        birthDate: user.birthDate ?? placeholder.birthDate,
        medicalHistory: user.medicalHistory ?? placeholder.medicalHistory,
        profileCompleted: true,
      },
    }),
    prisma.patientInvite.update({
      where: { id: invite.id },
      data: { redeemedAt: new Date(), mobileUserId: target },
    }),
    // The placeholder now owns nothing; remove it.
    prisma.mobileUser.delete({ where: { id: src } }),
  ]);

  return Response.json({ ok: true, patientId: target });
}
