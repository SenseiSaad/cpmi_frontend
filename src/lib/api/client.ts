/**
 * HTTP client for the real backend.
 *
 * Mechanics (verified against cpmi-backend):
 *  - Same-origin through the Next rewrite `/api/*` → backend, so the HttpOnly
 *    SameSite=Lax `ca_session` cookie works and the middleware can see it.
 *  - CSRF is double-submit: `GET /api/auth/csrf` returns a token (and sets `ca_csrf`);
 *    it must ride along as `X-CSRF-Token` on EVERY mutation, including login.
 *  - Errors are `{ error: { code, message, requestId, details? } }`.
 *  - A 401 on any authenticated call notifies listeners (the provider redirects to /login).
 */
import { env } from "@/config/env";

import { ApiClientError, codeForStatus, type ApiErrorCode } from "./error";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

let csrfToken: string | null = null;
let csrfFetch: Promise<string | null> | null = null;

type UnauthenticatedListener = () => void;
const unauthenticatedListeners = new Set<UnauthenticatedListener>();

/** Registers a callback fired when any authenticated request returns 401. */
export function onUnauthenticated(listener: UnauthenticatedListener): () => void {
  unauthenticatedListeners.add(listener);
  return () => unauthenticatedListeners.delete(listener);
}

function notifyUnauthenticated() {
  unauthenticatedListeners.forEach((listener) => listener());
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>): string {
  const url = `${env.apiBaseUrl}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function fetchCsrfToken(force = false): Promise<string | null> {
  if (csrfToken && !force) return csrfToken;
  if (csrfFetch) return csrfFetch;
  csrfFetch = (async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/auth/csrf`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { csrfToken?: string; csrf_token?: string };
      csrfToken = body.csrfToken ?? body.csrf_token ?? null;
      return csrfToken;
    } catch {
      return null;
    } finally {
      csrfFetch = null;
    }
  })();
  return csrfFetch;
}

interface ParsedError {
  code?: string;
  message?: string;
  requestId?: string;
  details?: { field: string; message: string }[];
}

function parseError(body: unknown): ParsedError {
  const raw = (body ?? {}) as Record<string, unknown>;
  const envelope = (raw.error && typeof raw.error === "object" ? raw.error : raw) as Record<string, unknown>;
  const details = Array.isArray(envelope.details)
    ? (envelope.details as { field?: unknown; message?: unknown }[])
        .filter((d) => typeof d?.field === "string" && typeof d?.message === "string")
        .map((d) => ({ field: d.field as string, message: d.message as string }))
    : undefined;
  return {
    code: typeof envelope.code === "string" ? envelope.code : undefined,
    message: typeof envelope.message === "string" ? envelope.message : undefined,
    requestId: typeof envelope.requestId === "string" ? envelope.requestId : undefined,
    details,
  };
}

const KNOWN_CODES: ReadonlySet<string> = new Set<ApiErrorCode>([
  "bad_request",
  "validation_failed",
  "unauthenticated",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "unavailable",
  "internal",
]);

export interface HttpOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Send this text verbatim (e.g. a CSV upload) instead of a JSON-encoded body. */
  rawBody?: { text: string; contentType: string };
}

/** Performs one API call and returns the parsed JSON body (or undefined for 204). */
export async function http<T>(method: HttpMethod, path: string, body?: unknown, options: HttpOptions = {}): Promise<T> {
  const mutating = method !== "GET";

  const send = async (retriedCsrf: boolean): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options.headers,
    };
    if (options.rawBody) headers["Content-Type"] = options.rawBody.contentType;
    else if (body !== undefined) headers["Content-Type"] = "application/json";
    if (mutating) {
      const token = retriedCsrf ? await fetchCsrfToken(true) : csrfToken ?? (await fetchCsrfToken());
      if (token) headers["X-CSRF-Token"] = token;
    }
    const init: RequestInit = {
      method,
      credentials: "include",
      cache: "no-store",
      headers,
      signal: options.signal,
    };
    if (options.rawBody) init.body = options.rawBody.text;
    else if (body !== undefined) init.body = JSON.stringify(body);
    return fetch(buildUrl(path, options.query), init);
  };

  let res: Response;
  try {
    res = await send(false);
    // The CSRF cookie/token may have rotated; refresh once and retry the mutation.
    if (mutating && (res.status === 401 || res.status === 403)) {
      const refreshed = await fetchCsrfToken(true);
      if (refreshed) res = await send(true);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiClientError("unavailable", "Could not reach the service. Check your connection and try again.");
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const parsed = parseError(payload);
    const code = (parsed.code && KNOWN_CODES.has(parsed.code) ? parsed.code : codeForStatus(res.status)) as ApiErrorCode;
    // Expected 401s on the session probe / bad credentials must not trigger the global redirect.
    const authProbe = path === "/api/auth/me" || path === "/api/auth/login" || path === "/api/auth/csrf";
    if (res.status === 401 && !authProbe) notifyUnauthenticated();
    const message =
      res.status === 401
        ? "Invalid email or password"
        : res.status === 403
          ? parsed.message && !mutating ? parsed.message : "You do not have permission to perform this action."
          : (parsed.message ?? defaultMessage(res.status));
    throw new ApiClientError(code, message, { status: res.status, requestId: parsed.requestId, details: parsed.details });
  }

  return payload as T;
}

function defaultMessage(status: number): string {
  if (status === 404) return "The requested item could not be found.";
  if (status === 409) return "This change conflicts with the current state. Refresh and try again.";
  if (status === 422) return "Please review the highlighted fields.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "The service is temporarily unavailable. Please try again shortly.";
  return "Something went wrong. Please try again.";
}
