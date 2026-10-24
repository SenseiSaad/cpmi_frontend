import { NextResponse, type NextRequest } from "next/server";

/**
 * Same-origin reverse proxy for the API.
 *
 * The browser only ever calls same-origin /api/* so the backend's session + CSRF
 * cookies stay first-party. The platform rewrite in next.config.mjs forwarded the
 * backend's/Set-Cookie headers untouched, which breaks on Vercel when the backend
 * sets an explicit `Domain=<backend-host>` attribute: the browser silently drops
 * cross-site cookies, and auth loops forever. This handler takes over the proxy and
 * strips the `Domain` attribute so cookies are stored for the frontend origin.
 *
 * BACKEND_ORIGIN shouldn't be user-configurable per request; it is read at runtime on
 * the server (same env the rewrite used), so no new client env is required.
 */

const backendOrigin = (process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:4000").replace(/\/+$/, "");

// Hop-by-hop / auto-managed headers that must not be forwarded verbatim.
const REQUEST_SKIP = new Set([
  "host",
  "connection",
  "keep-alive",
  "upgrade",
  "transfer-encoding",
  "accept-encoding",
  "content-length",
]);

const RESPONSE_SKIP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  // undici decompresses transparently, so the original encoding headers lie to the browser.
  "content-length",
  "content-encoding",
  "set-cookie", // sanitized separately below
]);

/** Remove the `Domain=…` attribute so the cookie is stored for the serving origin (host-only). */
function sanitizeCookie(cookie: string): string {
  return cookie
    .split(";")
    .filter((part) => (part.trim().split("=")[0] ?? "").toLowerCase() !== "domain")
    .join(";");
}

async function proxy(request: NextRequest, context: { params: { path: string[] } }) {
  const { path } = context.params;
  const target = new URL(`/api/${path.map(encodeURIComponent).join("/")}`, backendOrigin);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (!REQUEST_SKIP.has(key)) headers.set(key, value);
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "upstream_unavailable",
          message: "The API is temporarily unreachable. Please try again shortly.",
        },
      },
      { status: 502 },
    );
  }

  const outHeaders = new Headers();
  for (const [key, value] of upstream.headers) {
    if (!RESPONSE_SKIP.has(key) && key !== "set-cookie") outHeaders.append(key, value);
  }

  const setCookies = upstream.headers.getSetCookie();
  for (const cookie of setCookies) {
    outHeaders.append("set-cookie", sanitizeCookie(cookie));
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText || undefined,
    headers: outHeaders,
  });
}

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
