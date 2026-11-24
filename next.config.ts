import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default Server-Action-Limit ist 1 MB — Familienfotos erlauben bis 10 MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
