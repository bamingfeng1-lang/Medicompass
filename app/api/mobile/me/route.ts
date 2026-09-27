import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { diffProfile, recordProfileEdit } from "@/lib/profile-audit";

// GET    /api/mobile/me  — profile + current tier
// PATCH  /api/mobile/me  — update onboarding/medical profile fields
// DELETE /api/mobile/me  — delete the account and ALL owned data (GDPR)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENDERS = ["male", "female", "other"];
const BLOOD_TYPES = ["A", "B", "AB", "O", "unknown"];

function shape(user: {
  id: string; name: string | null; email: string | null; tier: string;
  gender: string | null; birthDate: Date | null; bloodType: string | null;
  allergies: string | null; medicalHistory: string | null;
  profileCompleted: boolean; createdAt: Date;
  familyId: string | null; shareAlertsWithCaregivers: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    tier: user.tier,
    gender: user.gender,
    birthDate: user.birthDate,
    bloodType: user.bloodType,
    allergies: user.allergies,
    medicalHistory: user.medicalHistory,
    profileCompleted: user.profileCompleted,
    familyId: user.familyId,
    shareAlertsWithCaregivers: user.shareAlertsWithCaregivers,
    createdAt: user.createdAt,
  };
}

export async function GET(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();
  return Response.json(shape(user));
}

export async function PATCH(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  let body: {
    name?: string; gender?: string; birthDate?: string;
    bloodType?: string; allergies?: string; medicalHistory?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "missing_name" }, { status: 400 });

  const gender = GENDERS.includes(String(body.gender)) ? String(body.gender) : null;
  const bloodType = BLOOD_TYPES.includes(String(body.bloodType)) ? String(body.bloodType) : null;

  let birthDate: Date | null = null;
  if (typeof body.birthDate === "string" && body.birthDate) {
    const d = new Date(body.birthDate);
    if (!Number.isNaN(d.getTime())) birthDate = d;
  }

  const allergies = typeof body.allergies === "string" ? body.allergies.trim() : null;
  const medicalHistory = typeof body.medicalHistory === "string" ? body.medicalHistory.trim() : null;

  // Field-level diff against the current row for the edit-history audit trail.
  const nextValues = { name, gender, birthDate, bloodType, allergies, medicalHistory };
  const changes = diffProfile(user, nextValues);

  const updated = await prisma.mobileUser.update({
    where: { id: user.id },
    data: {
      name,
      gender,
      birthDate,
      bloodType,
      allergies,
      medicalHistory,
      profileCompleted: true,
    },
  });

  // Self-edit: actor == subject. Never blocks the response.
  await recordProfileEdit({
    subjectId: user.id,
    actorId: user.id,
    actorName: updated.name,
    action: "update",
    changes,
  });

  return Response.json(shape(updated));
}

export async function DELETE(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  // Schema cascades (onDelete: Cascade) remove threads/turns, reports,
  // consults/messages/attachments, subscriptions, devices, medications,
  // doseLogs, careTasks, vitals, visits/attachments, wellnessPlans, consents,
  // proactiveNotes and patientInvites. But UsageCounter (keyed by a plain
  // scopeId string, no FK) and any Family this user OWNS (ownerId is a plain
  // string) have no cascade, so clean them explicitly in one transaction.
  await prisma.$transaction(async (tx) => {
    // If this user owns family groups, dissolve them: return the other members
    // to solo/free accounts, drop family-scoped usage counters, and delete the
    // Family (which cascades its FamilyInvites) so nothing is left ownerless.
    const owned = await tx.family.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (owned.length) {
      const familyIds = owned.map((f) => f.id);
      await tx.mobileUser.updateMany({
        where: { familyId: { in: familyIds }, id: { not: user.id } },
        data: { familyId: null, tier: "free", familyRole: "owner" },
      });
      await tx.usageCounter.deleteMany({
        where: { scopeType: "family", scopeId: { in: familyIds } },
      });
      await tx.family.deleteMany({ where: { id: { in: familyIds } } });
    }

    // This account's own (solo-scope) usage counters.
    await tx.usageCounter.deleteMany({
      where: { scopeType: "user", scopeId: user.id },
    });

    // Ephemeral email OTP codes are keyed by email (no FK); drop this PII too.
    if (user.email) {
      await tx.emailCode.deleteMany({ where: { email: user.email } });
    }

    await tx.mobileUser.delete({ where: { id: user.id } });
  });

  return Response.json({ ok: true });
}
