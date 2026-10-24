/**
 * Central environment configuration. Only public, non-secret values belong
 * here. No tokens, keys or credentials are ever stored in the frontend.
 */
export const env = {
  /**
   * Absolute backend origin, used only when the same-origin `/api/*` rewrite is
   * disabled at build time. Leave empty in production: the Next rewrite proxies
   * `/api/*` to `BACKEND_ORIGIN` so session + CSRF cookies stay first-party.
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  /** `live` talks to the real backend; `mock` is the offline demo adapter. */
  apiMode: (process.env.NEXT_PUBLIC_API_MODE ?? "live") as "live" | "mock",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development",
} as const;

export const isProduction = env.environment === "production";
