import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route gating by role (Next.js 16 "proxy", formerly middleware). It reads the DEMO cookie today;
 * with the real backend it checks for the HttpOnly `ca_session` cookie. This is an optimistic
 * redirect only — authorisation is always enforced by the API, never by the UI.
 */
const COOKIE = "ca_demo_role";

const HOME: Record<string, string> = {
  learner: "/learn",
  agency_admin: "/agency",
  super_admin: "/admin",
  training_manager: "/admin",
};

const PORTAL_ROLES: Record<string, string[]> = {
  "/learn": ["learner"],
  "/agency": ["agency_admin"],
  "/admin": ["super_admin", "training_manager"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(COOKIE)?.value ?? "";
  const home = HOME[role];

  const portal = Object.keys(PORTAL_ROLES).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (portal) {
    if (!home) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (!PORTAL_ROLES[portal]!.includes(role)) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  // Signed-in users do not need the sign-in screens.
  if (home && (pathname === "/login" || pathname === "/forgot-password")) {
    return NextResponse.redirect(new URL(home, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/learn/:path*", "/agency/:path*", "/admin/:path*", "/login", "/forgot-password"],
};
