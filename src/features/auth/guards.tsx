"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useSession } from "./session-context";
import { dashboardForRole } from "./dashboard-for-role";
import { type Role } from "./roles";

/**
 * Route guard for a portal area. UX only: the backend authorizes every request.
 * 401 → sign in again; signed in with the wrong role → access denied.
 */
export function RequireAuth({ children, roles }: { children: ReactNode; roles: Role[] }) {
  const { status, user } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-hidden="true" />
        <span className="ml-3 text-sm font-semibold text-gray-600">Loading your session…</span>
      </div>
    );
  }
  if (status === "unauthenticated" || !user) return null;

  if (!user.roles.some((role) => roles.includes(role))) {
    return <AccessDenied home={dashboardForRole(user.roles)} />;
  }
  return <>{children}</>;
}

export function AccessDenied({ home = "/" }: { home?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F9FA] px-6 text-center">
      <div className="rounded-full bg-secondary-50 p-4 text-secondary-600" aria-hidden="true">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-primary-900">Access denied</h1>
      <p className="max-w-md text-sm text-gray-600">
        Your account does not have permission to view this area. If you believe this is a mistake, contact
        your agency administrator.
      </p>
      <Link href={home} className="btn-primary">
        Go to my dashboard
      </Link>
    </div>
  );
}
