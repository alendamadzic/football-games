import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: [
    "@football/shared",
    "@football/transfermarkt",
    "@football/ui",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "tmssl.akamaized.net" },
      { protocol: "https", hostname: "img.a.transfermarkt.technology" },
    ],
  },
};

export default nextConfig;
