"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { mockGetCurrentUser } from "@/lib/mock-auth";
import { getRoleDashboard } from "@/lib/utils";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = mockGetCurrentUser();
    if (user) {
      router.replace(getRoleDashboard(user.role));
    } else {
      router.replace("/learner");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <span className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse" />
        <span>Redirecting to your compliance dashboard...</span>
      </div>
    </div>
  );
}
