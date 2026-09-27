import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { entitlementsFor } from "@/lib/products";
import { hashInviteCode } from "@/lib/inviteCode";

// POST /api/mobile/family/invite/redeem  body: { code }
// An existing account joins a family by its invite code. Re-checks the member
// cap at redeem time and marks the invite consumed.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();
  if (user.familyId) return Response.json({ error: "already_in_family" }, { status: 409 });

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) return Response.json({ error: "missing_code" }, { status: 400 });

  const invite = await prisma.familyInvite.findFirst({
    where: { codeHash: hashInviteCode(code), redeemedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!invite) return Response.json({ error: "invalid_or_expired_code" }, { status: 404 });

  const family = await prisma.family.findUnique({ where: { id: invite.familyId } });
  if (!family) return Response.json({ error: "invalid_or_expired_code" }, { status: 404 });

  const cap = entitlementsFor(family.tier).memberCap;
  const memberCount = await prisma.mobileUser.count({ where: { familyId: family.id } });
  if (memberCount >= cap) return Response.json({ error: "member_cap_reached", cap }, { status: 409 });

  await prisma.$transaction([
    prisma.mobileUser.update({
      where: { id: user.id },
      data: { familyId: family.id, familyRole: "member" },
    }),
    prisma.familyInvite.update({ where: { id: invite.id }, data: { redeemedAt: new Date() } }),
  ]);

  return Response.json({ family: { id: family.id, tier: family.tier } });
}
