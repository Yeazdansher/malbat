import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default Server-Action-Limit ist 1 MB — Mehrfach-Upload Familienfotos bis 50 MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
