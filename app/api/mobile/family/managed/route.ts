import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { entitlementsFor } from "@/lib/products";
import { diffProfile, recordProfileEdit } from "@/lib/profile-audit";

// POST /api/mobile/family/managed  body: { name, gender?, birthDate?, medicalHistory? }
// Creates a login-less "managed" profile inside the caller's family — a person a
// caregiver acts on behalf of (场景 D/E 异地父母). It counts against the member
// cap. The caregiver switches into it via the X-Profile-Id header.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();
  if (!user.familyId) return Response.json({ error: "not_in_family" }, { status: 403 });
  if (user.familyRole === "managed") return Response.json({ error: "forbidden" }, { status: 403 });

  const family = await prisma.family.findUnique({ where: { id: user.familyId } });
  if (!family) return Response.json({ error: "not_in_family" }, { status: 403 });

  const cap = entitlementsFor(family.tier).memberCap;
  const memberCount = await prisma.mobileUser.count({ where: { familyId: family.id } });
  if (memberCount >= cap) return Response.json({ error: "member_cap_reached", cap }, { status: 409 });

  let body: { name?: string; gender?: string; birthDate?: string; medicalHistory?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "missing_name" }, { status: 400 });

  const birthDate = body.birthDate ? new Date(body.birthDate) : null;

  const profile = await prisma.mobileUser.create({
    data: {
      name,
      gender: body.gender ?? null,
      birthDate: birthDate && !isNaN(birthDate.getTime()) ? birthDate : null,
      medicalHistory: body.medicalHistory ?? null,
      profileCompleted: true,
      tier: "free", // effective entitlements come from the family scope
      familyId: family.id,
      familyRole: "managed",
      managedById: user.id,
    },
  });

  // Seed the edit history: the caregiver created this profile's initial data.
  await recordProfileEdit({
    subjectId: profile.id,
    actorId: user.id,
    actorName: user.name,
    action: "create",
    changes: diffProfile(
      {},
      {
        name: profile.name,
        gender: profile.gender,
        birthDate: profile.birthDate,
        medicalHistory: profile.medicalHistory,
      },
    ),
  });

  return Response.json(
    { profile: { id: profile.id, name: profile.name, role: profile.familyRole, managed: true } },
    { status: 201 },
  );
}
