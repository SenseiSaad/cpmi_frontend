/**
 * Single entry point the UI imports. `NEXT_PUBLIC_API_MODE=live` (default) talks to the real
 * backend; `mock` uses the in-memory demo adapter for offline UI work.
 */
import { env } from "@/config/env";

import { liveApi } from "./live";
import { mockApi, type MemberQuery } from "./mock";

export const api = env.apiMode === "mock" ? mockApi : (liveApi as unknown as typeof mockApi);

export { ApiClientError } from "./error";
export { setMockIdentity } from "./mock";
export type { MemberQuery };
export * from "./types";
