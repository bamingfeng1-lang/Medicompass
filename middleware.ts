import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Edge-safe: only uses `jose` (no Prisma/bcrypt imports, which can't run on
// the Edge runtime). Protects the admin UI + admin API.

const SESSION_COOKIE = "mc_admin_session";

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

// Matches /zh/admin, /en/admin and their subpaths, but not /zh/admin/login.
const ADMIN_PAGE = /^\/(zh|en)\/admin(?:\/(?!login).*)?$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin API (except login)
  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login") {
    if (await hasValidSession(req)) return NextResponse.next();
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Admin pages (except the login page)
  if (ADMIN_PAGE.test(pathname)) {
    if (await hasValidSession(req)) return NextResponse.next();
    const lang = pathname.split("/")[1] || "zh";
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}/admin/login`;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(zh|en)/admin/:path*", "/api/admin/:path*"],
};
