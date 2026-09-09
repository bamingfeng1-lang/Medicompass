import { NextRequest, NextResponse } from "next/server";

// The Python (FastAPI) backend owns AUTH_SECRET and validates the JWT. Here we
// only gate the admin *pages* on the presence of the session cookie so
// unauthenticated users are redirected to the login page. The backend still
// verifies the token on every admin API call, so a forged/expired cookie can't
// actually read data — the admin pages fetch through the backend and redirect
// to /login on a 401.

const SESSION_COOKIE = "mc_admin_session";

function hasSessionCookie(req: NextRequest): boolean {
  return Boolean(req.cookies.get(SESSION_COOKIE)?.value);
}

// Matches /zh/admin, /en/admin and their subpaths, but not /zh/admin/login.
const ADMIN_PAGE = /^\/(zh|en)\/admin(?:\/(?!login).*)?$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ADMIN_PAGE.test(pathname)) {
    if (hasSessionCookie(req)) return NextResponse.next();
    const lang = pathname.split("/")[1] || "zh";
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}/admin/login`;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(zh|en)/admin/:path*"],
};

