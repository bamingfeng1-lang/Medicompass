import { verifyAppleIdentityToken } from "@/lib/apple";
import { signMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

// POST /api/mobile/auth/apple
// Body: { identityToken: string, name?: string, email?: string }
// Verifies the Apple identity token, upserts the MobileUser, returns an app JWT.
// Apple only sends name/email on the FIRST authorization, so we accept them
// from the client and persist if we don't have them yet.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  // Throttle token-verification abuse: 20 per IP per 10 minutes.
  const rl = rateLimit(`apple:${clientIp(req)}`, 20, 10 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  let body: { identityToken?: string; name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const idToken = typeof body.identityToken === "string" ? body.identityToken : "";
  if (!idToken) {
    return Response.json({ error: "missing_identity_token" }, { status: 400 });
  }

  let identity;
  try {
    identity = await verifyAppleIdentityToken(idToken);
  } catch (err) {
    return Response.json(
      { error: "invalid_apple_token", detail: err instanceof Error ? err.message : String(err) },
      { status: 401 },
    );
  }

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;
  const email = identity.email ?? (typeof body.email === "string" ? body.email : undefined);

  const user = await prisma.mobileUser.upsert({
    where: { appleUserId: identity.sub },
    update: {
      // Only fill fields we don't already have (Apple sends them once).
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
    },
    create: {
      appleUserId: identity.sub,
      email: email ?? null,
      name: name ?? null,
    },
  });

  const token = await signMobileToken(user.id);
  return Response.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, tier: user.tier },
  });
}
