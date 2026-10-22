"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROLE_HOME } from "@/lib/api/fixtures";
import { useSession } from "@/lib/auth/session";

/** Sends a signed-in user to the portal that matches their role. */
export default function DashboardRedirectPage() {
  const { user, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? ROLE_HOME[user.role] : "/login");
  }, [ready, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas" role="status" aria-live="polite">
      <Loader2 className="size-6 animate-spin text-brand-700" aria-hidden="true" />
      <span className="ml-3 text-sm font-semibold text-ink-600">Taking you to your dashboard…</span>
    </div>
  );
}
