import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The browser only ever calls same-origin /api/*; Next.js forwards it to the backend so the
// backend's session + CSRF cookies stay first-party (SameSite=Lax). Set at build time.
const backendOrigin = (process.env.BACKEND_ORIGIN ?? "http://localhost:4000").replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return process.env.BACKEND_PROXY === "false"
      ? []
      : [{ source: "/api/:path*", destination: `${backendOrigin}/api/:path*` }];
  },
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
