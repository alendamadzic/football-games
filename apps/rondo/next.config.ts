import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 Cached Components — enables the `'use cache'` directive
  // used by the Transfermarkt data layer (see src/lib/tm/client.ts).
  cacheComponents: true,
  reactCompiler: true,
  transpilePackages: ["@football/transfermarkt", "@football/ui"],
};

export default nextConfig;
