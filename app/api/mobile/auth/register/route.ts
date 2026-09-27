import bcrypt from "bcryptjs";
import { signMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

// POST /api/mobile/auth/register
// Body: { email: string, password: string, name?: string }
// Creates an email/password MobileUser and returns an app JWT.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request): Promise<Response> {
  // Throttle account-creation spam: 10 per IP per 10 minutes.
  const rl = rateLimit(`register:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "weak_password" }, { status: 400 });
  }

  const existing = await prisma.mobileUser.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "email_taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.mobileUser.create({
    data: { email, passwordHash, name },
  });

  const token = await signMobileToken(user.id);
  return Response.json(
    { token, user: { id: user.id, name: user.name, email: user.email, tier: user.tier } },
    { status: 201 },
  );
}
