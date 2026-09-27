import bcrypt from "bcryptjs";
import { signMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

// POST /api/mobile/auth/login
// Body: { email: string, password: string }
// Verifies email/password and returns an app JWT.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  // Throttle password guessing: 10 attempts per IP per 5 minutes.
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 5 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return Response.json({ error: "missing_credentials" }, { status: 400 });
  }

  const user = await prisma.mobileUser.findUnique({ where: { email } });
  // Constant-ish response: same error whether the email or the password is wrong.
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = await signMobileToken(user.id);
  return Response.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, tier: user.tier },
  });
}
