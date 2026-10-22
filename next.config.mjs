import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The browser only ever calls same-origin /api/*; Next.js forwards it to the backend so the
// backend's session + CSRF cookies stay first-party (SameSite=Lax). Set at build time.
const backendOrigin = (process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:4000").replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return process.env.BACKEND_PROXY === "false"
      ? []
      : [{ source: "/api/:path*", destination: `${backendOrigin}/api/:path*` }];
  },
  redirects: async () => [
    // Legacy demo routes kept alive during the Zed migration; backend emails also point at
    // a few of these (see FRONTEND_BASE_URL links in the API). Keep them working.
    { source: "/auth/login", destination: "/login", permanent: false },
    { source: "/auth/forgot-password", destination: "/forgot-password", permanent: false },
    { source: "/auth/invitation", destination: "/invitations/accept", permanent: false },
    { source: "/learn/:path*", destination: "/learner/:path*", permanent: false },
    { source: "/learner/learning", destination: "/learner/courses", permanent: false },
    { source: "/billing", destination: "/agency/store", permanent: false },
    { source: "/billing/success", destination: "/agency/orders", permanent: false },
    { source: "/billing/cancelled", destination: "/agency/store", permanent: false },
  ],
  images: {
    domains: ["images.unsplash.com", "via.placeholder.com"],
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
};

export default nextConfig;
