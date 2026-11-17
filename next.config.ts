import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Ensure server action body size limits or other configs if needed
  experimental: {},
};

export default nextConfig;
