import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default Server-Action-Limit ist 1 MB — Profil-/Personenfotos erlauben bis 2 MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
