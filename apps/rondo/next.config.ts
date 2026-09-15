import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 Cached Components — enables the `'use cache'` directive
  // used by the TheSportsDB data layer (see src/lib/sportsdb/client.ts).
  cacheComponents: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      // TheSportsDB serves club badges and player cutouts from this CDN.
      { protocol: "https", hostname: "r2.thesportsdb.com" },
    ],
  },
};

export default nextConfig;
