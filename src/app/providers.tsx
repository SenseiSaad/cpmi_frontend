"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { api } from "@/lib/api/client";
import { SessionProvider } from "@/features/auth/session-context";
import { AgencyProvider } from "@/features/auth/agency-context";

/** A 401 on any authenticated call means the server session ended: go to sign-in. */
function SessionExpiryRedirect() {
  useEffect(
    () =>
      api.onUnauthenticated(() => {
        const here = window.location.pathname;
        if (!here.startsWith("/auth")) {
          window.location.assign(`/auth/login?expired=1&next=${encodeURIComponent(here)}`);
        }
      }),
    [],
  );
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AgencyProvider>
          <SessionExpiryRedirect />
          {children}
        </AgencyProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
