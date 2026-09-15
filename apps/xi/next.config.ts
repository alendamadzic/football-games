import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  transpilePackages: ["@football/transfermarkt", "@football/ui"],
};

export default nextConfig;
