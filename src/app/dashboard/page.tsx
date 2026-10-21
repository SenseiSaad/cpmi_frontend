"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session-context";
import { dashboardForRole } from "@/features/auth/dashboard-for-role";

/** Sends a signed-in user to their portal, everyone else to sign-in. */
export default function DashboardRedirect() {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "authenticated" && user) router.replace(dashboardForRole(user.roles));
    else if (status === "unauthenticated") router.replace("/auth/login?next=/dashboard");
  }, [status, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <span className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse" />
        <span>Redirecting to your compliance dashboard...</span>
      </div>
    </div>
  );
}
