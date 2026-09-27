import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationCode, mailConfigured } from "@/lib/mailer";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

// POST /api/mobile/auth/code/request
// Body: { email: string }
// Generates a 6-digit code, emails it, and stores it hashed for verification.
// Passwordless: the same flow serves both first-time register and login.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds between sends

export async function POST(req: Request): Promise<Response> {
  // IP throttle (across emails) on top of the per-email cooldown below: 5/10min.
  const rl = rateLimit(`code-request:${clientIp(req)}`, 5, 10 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  // Throttle: reject if a code was already sent very recently.
  const recent = await prisma.emailCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return Response.json({ error: "too_many_requests" }, { status: 429 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const codeHash = await bcrypt.hash(code, 10);

  // One live code per email: clear old ones, then store the new one.
  await prisma.emailCode.deleteMany({ where: { email } });
  await prisma.emailCode.create({
    data: { email, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  const emailed = await sendVerificationCode(email, code);

  // In dev (no SMTP) return the code so the flow is testable end-to-end.
  return Response.json({ ok: true, ...(emailed ? {} : { devCode: code }) });
}
