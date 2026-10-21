import { api } from "@/lib/api/client";

export type CertificateType = "module" | "course" | string;

export interface VerifiedCertificate {
  certificateNumber: string;
  certificateType: CertificateType;
  learnerName: string;
  courseTitle: string;
  moduleTitle: string | null;
  issuedAt: string;
  expiresAt: string | null;
}

export interface CertificateVerification {
  found: boolean;
  valid: boolean;
  certificate?: VerifiedCertificate;
  revocation?: { revokedAt: string; reason: string };
}

/** Backend accepts tokens of 10–200 characters. */
export function isPlausibleToken(token: string): boolean {
  const t = token.trim();
  return t.length >= 10 && t.length <= 200;
}

/** Extract a token from a pasted value: either a raw token or a URL containing `?token=` or `/verify/<token>`. */
export function extractToken(input: string): string {
  const value = input.trim();
  if (!value) return "";
  try {
    const url = new URL(value, "https://placeholder.local");
    const fromQuery = url.searchParams.get("token");
    if (fromQuery) return fromQuery.trim();
    const match = url.pathname.match(/\/verify\/([^/]+)\/?$/);
    if (match?.[1] && /^https?:\/\//i.test(value)) return decodeURIComponent(match[1]);
  } catch {
    /* not a URL */
  }
  return value;
}

export const publicApi = {
  /** GET /api/public/certificates/verify?token=… — unauthenticated, rate-limited. */
  verifyCertificate(token: string, signal?: AbortSignal): Promise<CertificateVerification> {
    return api.get<CertificateVerification>(
      `/api/public/certificates/verify?token=${encodeURIComponent(token.trim())}`,
      { signal },
    );
  },
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "No expiry";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
