"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ROLE_HOME } from "@/lib/api/fixtures";
import type { RoleCode } from "@/lib/api";
import { useSession } from "@/lib/auth/session";

/**
 * Client-side route guard for a portal area. UX only: the backend authorizes every request.
 * 401 → sign in again; signed in with the wrong role → access denied.
 */
export function PortalGuard({ roles, children }: { roles: RoleCode[]; children: ReactNode }) {
  const { user, ready } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [ready, user, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas" role="status" aria-live="polite">
        <Loader2 className="size-6 animate-spin text-brand-700" aria-hidden="true" />
        <span className="ml-3 text-sm font-semibold text-ink-600">Loading your session…</span>
      </div>
    );
  }
  if (!user) return null;

  if (!roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <div className="rounded-full bg-amber-50 p-4 text-amber-600" aria-hidden="true">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="text-2xl font-black text-ink-900">Access denied</h1>
        <p className="max-w-md text-sm text-ink-600">
          Your account does not have permission to view this area. If you believe this is a mistake, contact your
          agency administrator.
        </p>
        <ButtonLink href={ROLE_HOME[user.role]} variant="dark">
          Go to my dashboard
        </ButtonLink>
      </div>
    );
  }

  return <>{children}</>;
}
