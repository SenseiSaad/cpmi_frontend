// Account-recovery and invitation flows used by the public auth pages.
//
// Same switch as the sign-in page: demo behaviour by default, the real API when
// NEXT_PUBLIC_USE_MOCK_AUTH=false. Pages only talk to this file, so connecting the backend later
// changes the environment, not the pages.

import { mockEstablishSession } from "@/lib/mock-auth";
import { authService } from "@/services/auth.service";
import type { AcceptInvitationResponse, User, UserRole } from "@/types/auth";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type AuthFlowErrorCode = "expired" | "invalid" | "rate_limited" | "unknown";

export class AuthFlowError extends Error {
  constructor(
    message: string,
    readonly code: AuthFlowErrorCode = "unknown"
  ) {
    super(message);
    this.name = "AuthFlowError";
  }
}

const GENERIC = "Something went wrong. Please try again.";

/** Turns anything thrown (our error, an API error object, a network error) into text for the user. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return GENERIC;
}

export function errorCode(error: unknown): AuthFlowErrorCode {
  if (error instanceof AuthFlowError) return error.code;
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code) : "";
  if (code === "rate_limited") return "rate_limited";
  if (code === "bad_request" || code === "validation_failed" || code === "not_found") return "invalid";
  return "unknown";
}

/** Always resolves the same way whether or not the account exists (the API never reveals that). */
export async function requestPasswordReset(email: string): Promise<void> {
  if (USE_MOCK) {
    await wait(700);
    return;
  }
  await authService.forgotPassword({ email });
}

export async function confirmPasswordReset(token: string, password: string): Promise<void> {
  if (USE_MOCK) {
    await wait(800);
    if (token.length < 10) throw new AuthFlowError("This reset link is not valid. Request a new one.", "invalid");
    if (token.includes("expired")) {
      throw new AuthFlowError("This reset link has expired or was already used. Request a new one.", "expired");
    }
    return;
  }
  await authService.resetPassword({ token, password });
}

export interface AcceptInput {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AcceptResult {
  /** True when this acceptance created the account and opened a session. */
  signedIn: boolean;
  role?: UserRole;
}

const ROLE_PRIORITY: UserRole[] = ["super_admin", "training_manager", "agency_admin", "learner"];

function highestRole(user: AcceptInvitationResponse["user"]): UserRole | undefined {
  const granted = new Set((user?.roles ?? []).map((r) => r.roleCode));
  return ROLE_PRIORITY.find((role) => granted.has(role));
}

export async function acceptInvitation(input: AcceptInput): Promise<AcceptResult> {
  if (USE_MOCK) {
    await wait(900);
    if (input.token.length < 10) throw new AuthFlowError("This invitation link is not valid. Ask your administrator to resend it.", "invalid");
    if (input.token.includes("expired")) {
      throw new AuthFlowError("This invitation has expired or was revoked. Ask your administrator to send a new one.", "expired");
    }
    // A token containing "existing" stands in for someone who already has an account.
    if (input.token.includes("existing")) return { signedIn: false };

    const user: User = {
      id: "usr_ln_new",
      email: "new.learner@agency.gov",
      firstName: input.firstName,
      lastName: input.lastName,
      role: "learner",
      agencies: [{ agencyId: "agc_001", agencySlug: "federal-transit", agencyName: "Federal Transit Administration", role: "learner" }],
      activeAgencyId: "agc_001",
    };
    mockEstablishSession(user);
    return { signedIn: true, role: "learner" };
  }

  const response = await authService.acceptInvitation(input);
  return { signedIn: response.signedIn, role: response.signedIn ? highestRole(response.user) : undefined };
}

/** Accepts a pasted invitation link or a bare code and returns the token, or null if it is unusable. */
export function extractInvitationToken(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  let token = value;
  try {
    const fromUrl = new URL(value).searchParams.get("token");
    if (fromUrl) token = fromUrl;
  } catch {
    // Not a URL: treat the whole string as the code.
  }
  return token.length >= 10 && token.length <= 200 && /^[\w.~-]+$/.test(token) ? token : null;
}
