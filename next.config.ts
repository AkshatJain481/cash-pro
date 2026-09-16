import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Full JSON backups are restored through a server action.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
