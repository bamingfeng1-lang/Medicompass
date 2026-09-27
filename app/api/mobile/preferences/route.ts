import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// PATCH /api/mobile/preferences — update account notification preferences.
// Body: { shareAlertsWithCaregivers?: boolean }
// Currently the only preference is the PIPL/GDPR opt-in controlling whether this
// user's health alerts (missed-dose etc.) may fan out to their family caregivers.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  let body: { shareAlertsWithCaregivers?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  if (typeof body.shareAlertsWithCaregivers !== "boolean") {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const updated = await prisma.mobileUser.update({
    where: { id: user.id },
    data: { shareAlertsWithCaregivers: body.shareAlertsWithCaregivers },
  });

  return Response.json({ shareAlertsWithCaregivers: updated.shareAlertsWithCaregivers });
}
