import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// PATCH /api/mobile/family/sharing — the caller toggles whether family
// caregivers (owner/member) may view & manage their own health data. This is
// the "authorize in settings" opt-in the profile switcher / avatar gates on.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  let body: { share?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body.share !== "boolean") {
    return Response.json({ error: "invalid_share" }, { status: 400 });
  }

  const updated = await prisma.mobileUser.update({
    where: { id: user.id },
    data: { sharesHealthWithFamily: body.share },
  });
  return Response.json({ sharesHealth: updated.sharesHealthWithFamily });
}
