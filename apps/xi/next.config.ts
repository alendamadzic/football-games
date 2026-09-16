import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  transpilePackages: [
    "@football/shared",
    "@football/transfermarkt",
    "@football/ui",
  ],
};

export default nextConfig;
