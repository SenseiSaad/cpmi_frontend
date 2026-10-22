/**
 * Live session store. Holds the signed-in user (and their agency context) in memory so the
 * API adapter can resolve agency-scoped identifiers synchronously. Components use
 * `useSession()` from `@/lib/auth/session`, which subscribes to this store.
 */
import { http } from "./client";
import { ApiClientError } from "./error";
import type { AgencyRef, RoleCode, SessionUser } from "./types";

interface BackendRoleGrant {
  roleCode: string;
  agencyId: string | null;
}

interface BackendAgency {
  uuid: string;
  slug: string;
  name: string;
  role: string;
}

export interface BackendUser {
  userPublicId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: BackendRoleGrant[];
  agencies?: BackendAgency[];
}

const ROLE_PRIORITY: RoleCode[] = ["super_admin", "training_manager", "agency_admin", "learner"];

/** Highest-privilege role for navigation purposes; the API authorizes every request anyway. */
export function mapBackendUser(raw: BackendUser): SessionUser {
  const roles = (raw.roles ?? []).map((grant) => grant.roleCode as RoleCode);
  const role: RoleCode = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? "learner";
  const first = raw.agencies?.[0];
  const agency: AgencyRef | null = first ? { publicId: first.uuid, displayName: first.name, slug: first.slug } : null;
  const titleFallback = role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    userPublicId: raw.userPublicId,
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role,
    title: titleFallback,
    agency,
  };
}

let current: SessionUser | null = null;
const listeners = new Set<() => void>();

export function getSessionUser(): SessionUser | null {
  return current;
}

export function setSessionUser(user: SessionUser | null): void {
  current = user;
  listeners.forEach((listener) => listener());
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** GET /api/auth/me → mapped session user (or null when unauthenticated). */
export async function loadSessionUser(signal?: AbortSignal): Promise<SessionUser | null> {
  try {
    const { user } = await http<{ user: BackendUser }>("GET", "/api/auth/me", undefined, { signal });
    const mapped = mapBackendUser(user);
    setSessionUser(mapped);
    return mapped;
  } catch (error) {
    if (error instanceof ApiClientError && (error.code === "unauthenticated" || error.code === "forbidden")) {
      setSessionUser(null);
      return null;
    }
    throw error;
  }
}

/** The public agency id used by every agency-scoped endpoint. */
export function requireAgencyId(): string {
  const agencyId = current?.agency?.publicId;
  if (!agencyId) {
    throw new ApiClientError("forbidden", "No agency context is available for this account.");
  }
  return agencyId;
}
