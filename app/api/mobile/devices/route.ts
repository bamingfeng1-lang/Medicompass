import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// POST /api/mobile/devices  body: { apnsToken: string, env?: "development"|"production" }
// Registers (or refreshes) the device's APNs token for push. Actual delivery is
// handled by lib/push.ts, which needs your APNs .p8 key (see .env.example).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  let body: { apnsToken?: string; env?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const apnsToken = (body.apnsToken ?? "").trim();
  if (!apnsToken) return Response.json({ error: "missing_token" }, { status: 400 });
  const env = body.env === "production" ? "production" : "development";

  await prisma.mobileDevice.upsert({
    where: { apnsToken },
    update: { userId: user.id, env },
    create: { userId: user.id, apnsToken, env },
  });
  return Response.json({ ok: true });
}
