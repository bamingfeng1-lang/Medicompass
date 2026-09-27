import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { isFamilyTier, entitlementsFor } from "@/lib/products";
import { resolveBillingScope, usageFor } from "@/lib/entitlements";

// GET  /api/mobile/family — the caller's family: members, cap, shared usage.
// POST /api/mobile/family — create a family (caller must hold a family tier).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shapeMember(m: {
  id: string; name: string | null; familyRole: string; managedById: string | null;
}) {
  return {
    id: m.id,
    name: m.name,
    role: m.familyRole, // owner | member | managed
    managed: m.familyRole === "managed",
  };
}

export async function GET(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();
  if (!user.familyId) return Response.json({ family: null });

  const family = await prisma.family.findUnique({
    where: { id: user.familyId },
    include: { members: { orderBy: { createdAt: "asc" } } },
  });
  if (!family) return Response.json({ family: null });

  const ent = entitlementsFor(family.tier);
  const scope = await resolveBillingScope(user);
  const usage = await usageFor(scope);

  return Response.json({
    family: {
      id: family.id,
      tier: family.tier,
      isOwner: family.ownerId === user.id,
      memberCap: ent.memberCap,
      entitlements: ent,
      usage,
      members: family.members.map(shapeMember),
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();
  if (user.familyId) return Response.json({ error: "already_in_family" }, { status: 409 });
  if (!isFamilyTier(user.tier)) {
    return Response.json({ error: "family_tier_required" }, { status: 403 });
  }

  const family = await prisma.family.create({ data: { ownerId: user.id, tier: user.tier } });
  await prisma.mobileUser.update({
    where: { id: user.id },
    data: { familyId: family.id, familyRole: "owner" },
  });

  return Response.json({ family: { id: family.id, tier: family.tier } }, { status: 201 });
}
