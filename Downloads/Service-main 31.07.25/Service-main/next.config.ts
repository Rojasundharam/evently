import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This will ignore TypeScript errors during the build process
    ignoreBuildErrors: true,
  },
  /* your other config options can remain here */
};

export default nextConfig;