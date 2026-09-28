/** @type {import('next').NextConfig} */
const nextConfig = {
  // mupdf ships a WASM binary; keep it external so Next doesn't try to bundle
  // the .wasm and its loader (they're loaded from node_modules at runtime).
  experimental: {
    serverComponentsExternalPackages: ["mupdf"],
  },
};

export default nextConfig;
