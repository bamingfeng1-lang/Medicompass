/** @type {import('next').NextConfig} */

// Same-origin proxy: browser requests to /api/* are forwarded by the Next.js
// server to the Python (FastAPI) backend. This keeps the session cookie
// same-origin (no cross-site/CORS cookie issues). Configure the backend URL
// with API_PROXY_TARGET (defaults to http://localhost:8000).
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:8000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

