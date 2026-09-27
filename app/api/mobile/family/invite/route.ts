import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { entitlementsFor } from "@/lib/products";
import { generateInviteCode } from "@/lib/inviteCode";

// POST /api/mobile/family/invite — owner generates a one-time family join code.
// Enforces the tier's member cap against current membership.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();
  if (!user.familyId) return Response.json({ error: "not_in_family" }, { status: 403 });

  const family = await prisma.family.findUnique({ where: { id: user.familyId } });
  if (!family) return Response.json({ error: "not_in_family" }, { status: 403 });
  if (family.ownerId !== user.id) return Response.json({ error: "owner_only" }, { status: 403 });

  const cap = entitlementsFor(family.tier).memberCap;
  const memberCount = await prisma.mobileUser.count({ where: { familyId: family.id } });
  if (memberCount >= cap) {
    return Response.json({ error: "member_cap_reached", cap }, { status: 409 });
  }

  const { code, codeHash } = generateInviteCode();
  await prisma.familyInvite.create({
    data: { familyId: family.id, codeHash, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });

  return Response.json({ code, expiresInDays: 7 }, { status: 201 });
}
