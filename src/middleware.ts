import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic route gating (Next.js middleware). It only checks whether the backend's
 * HttpOnly `ca_session` cookie is present — role authorisation is decided by the API and
 * enforced in the UI by `PortalGuard` (which knows the role from GET /api/auth/me).
 * This is a UX redirect only; it is never the security boundary.
 */
const COOKIE = "ca_session";

const PORTALS = ["/learner", "/agency", "/admin"] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE)?.value);

  const portal = PORTALS.find((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (portal) {
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Signed-in users do not need the sign-in screens; /dashboard resolves the right home.
  if (hasSession && (pathname === "/login" || pathname === "/forgot-password")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/learner/:path*", "/agency/:path*", "/admin/:path*", "/login", "/forgot-password"],
};
