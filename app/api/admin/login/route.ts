import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }

  const session = await verifyCredentials(username, password);
  if (!session) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = await signSession(session);
  const res = NextResponse.json({ ok: true, username: session.username });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
