import bcrypt from "bcryptjs";
import { signMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

// POST /api/mobile/auth/code/verify
// Body: { email: string, code: string, name?: string }
// Verifies the emailed code. On success, finds or creates the MobileUser
// (register when new, login when existing) and returns an app JWT.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request): Promise<Response> {
  // IP throttle (across emails) on top of the per-code attempt cap below: 15/10min.
  const rl = rateLimit(`code-verify:${clientIp(req)}`, 15, 10 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  let body: { email?: string; code?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  if (!email || !code) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  const record = await prisma.emailCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return Response.json({ error: "code_expired" }, { status: 401 });
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailCode.deleteMany({ where: { email } });
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const ok = await bcrypt.compare(code, record.codeHash);
  if (!ok) {
    await prisma.emailCode.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 },
    });
    return Response.json({ error: "invalid_code" }, { status: 401 });
  }

  // Correct code — burn all codes for this email.
  await prisma.emailCode.deleteMany({ where: { email } });

  // Find-or-create: existing account = login, new = register.
  let user = await prisma.mobileUser.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.mobileUser.create({ data: { email, name } });
  } else if (name && !user.name) {
    user = await prisma.mobileUser.update({ where: { id: user.id }, data: { name } });
  }

  const token = await signMobileToken(user.id);
  return Response.json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email, tier: user.tier,
      profileCompleted: user.profileCompleted,
    },
  });
}
