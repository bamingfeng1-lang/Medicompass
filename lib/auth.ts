import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Lightweight admin session: a signed JWT in an httpOnly cookie.
// AUTH_SECRET must be set in the environment (see .env.example).

export const SESSION_COOKIE = "mc_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (set it in .env).");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { sub: string; username: string };

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return { sub: payload.sub, username: String(payload.username ?? "") };
  } catch {
    return null;
  }
}

/** Read + verify the session from the request cookies (server components / routes). */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

/** Verify username/password against the Admin table. */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<SessionPayload | null> {
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return null;
  return { sub: admin.id, username: admin.username };
}
