import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // /api/* is proxied by the same-origin route handler in src/app/api/[...path]/route.ts
  // (not a platform rewrite) so backend Set-Cookie headers can be sanitized for Vercel.
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
