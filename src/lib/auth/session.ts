"use client";

/**
 * Real session hook. The backend session is an HttpOnly `ca_session` cookie; on mount the
 * provider queries `GET /api/auth/me`, and this hook exposes the mapped user plus sign-out.
 * The in-memory store in `@/lib/api/session-store` is the synchronous mirror used by the API
 * adapter for agency-scoped calls.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";

import { api } from "@/lib/api";
import { getSessionUser, loadSessionUser, setSessionUser, subscribeSession } from "@/lib/api/session-store";
import type { RoleCode, SessionUser } from "@/lib/api";

export const SESSION_QUERY_KEY = ["session"] as const;

export interface Session {
  user: SessionUser | null;
  role: RoleCode | null;
  /** False during the first session probe, so UI can show a skeleton instead of flashing. */
  ready: boolean;
  /** Re-reads /api/auth/me (used after login / invitation acceptance). */
  refresh: () => Promise<SessionUser | null>;
  signOut: () => Promise<void>;
}

export function useSession(): Session {
  const queryClient = useQueryClient();
  const user = useSyncExternalStore(subscribeSession, getSessionUser, () => null);

  const meQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => loadSessionUser(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Once the probe has settled, `ready` is true even for anonymous visitors.
  const ready = user !== null || !meQuery.isPending;

  const refresh = useCallback(async () => {
    const fresh = await loadSessionUser();
    queryClient.setQueryData(SESSION_QUERY_KEY, fresh);
    return fresh;
  }, [queryClient]);

  const signOut = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setSessionUser(null);
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      // Drop every cached user-scoped query so the next sign-in starts clean.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "session" });
    }
  }, [queryClient]);

  return { user, role: user?.role ?? null, ready, refresh, signOut };
}
