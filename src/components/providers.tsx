"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { ToastProvider } from "@/components/ui/toast";
import { onUnauthenticated } from "@/lib/api/client";

/** A 401 on any authenticated call means the server session ended: go to sign-in. */
function SessionExpiryRedirect() {
  useEffect(
    () =>
      onUnauthenticated(() => {
        const here = window.location.pathname;
        if (!here.startsWith("/login") && !here.startsWith("/forgot-password") && !here.startsWith("/invitations") && !here.startsWith("/auth/")) {
          window.location.assign(`/login?expired=1&next=${encodeURIComponent(here)}`);
        }
      }),
    [],
  );
  return null;
}

function SmoothScroll({ children }: { children: ReactNode }) {
  // Always mounted (so children never remount); reduced-motion users get instant scrolling.
  const reduce = useReducedMotion();
  return (
    <ReactLenis root options={{ lerp: reduce ? 1 : 0.085, smoothWheel: !reduce, wheelMultiplier: 0.95, touchMultiplier: 1.3 }}>
      {children}
    </ReactLenis>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 20_000, refetchOnWindowFocus: false, retry: false } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user">
        <SmoothScroll>
          <ToastProvider>
            <SessionExpiryRedirect />
            {children}
          </ToastProvider>
        </SmoothScroll>
      </MotionConfig>
    </QueryClientProvider>
  );
}
