import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  experimental: {
    serverActions: {
      // Club logos, covers and event banners are uploaded through server actions.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
