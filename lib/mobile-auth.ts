import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import type { MobileUser } from "@prisma/client";

// Stateless bearer-token auth for the iOS app. Mirrors lib/auth.ts (admin
// cookie sessions) but issues a long-lived JWT the app stores in the Keychain
// and sends as `Authorization: Bearer <token>`. Reuses AUTH_SECRET.

const MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 days

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (set it in .env).");
  }
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(userId: string): Promise<string> {
  return new SignJWT({ kind: "mobile" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyMobileToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

function bearerFrom(req: Request): string | undefined {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return undefined;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1] : undefined;
}

/** Resolve the authenticated MobileUser from the request's bearer token. */
export async function getMobileUser(req: Request): Promise<MobileUser | null> {
  const userId = await verifyMobileToken(bearerFrom(req));
  if (!userId) return null;
  return prisma.mobileUser.findUnique({ where: { id: userId } });
}

// Active-profile resolution for family accounts. Data routes call this instead
// of getMobileUser so a caregiver (owner/member) can act on behalf of another
// profile in the SAME family by sending an `X-Profile-Id` header (场景 D/E).
// Absent/self header → the caller. Billing still resolves to the family scope.
export type ProfileResolution =
  | { ok: true; caller: MobileUser; profile: MobileUser }
  | { ok: false; response: Response };

export async function resolveProfile(req: Request): Promise<ProfileResolution> {
  const caller = await getMobileUser(req);
  if (!caller) return { ok: false, response: unauthorized() };

  const targetId = req.headers.get("x-profile-id") || undefined;
  if (!targetId || targetId === caller.id) return { ok: true, caller, profile: caller };

  const target = await prisma.mobileUser.findUnique({ where: { id: targetId } });
  if (!target) {
    return { ok: false, response: Response.json({ error: "profile_not_found" }, { status: 404 }) };
  }
  // Authorized iff both are in the same family and the caller can manage (owner/member).
  const authorized =
    !!caller.familyId &&
    caller.familyId === target.familyId &&
    (caller.familyRole === "owner" || caller.familyRole === "member");
  if (!authorized) {
    return { ok: false, response: Response.json({ error: "forbidden_profile" }, { status: 403 }) };
  }
  return { ok: true, caller, profile: target };
}

/** 401 JSON helper for routes that require auth. */
export function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
