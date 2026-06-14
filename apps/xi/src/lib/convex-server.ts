import { ConvexHttpClient } from "convex/browser";

// Server-side Convex HTTP client for reads inside Server Components / cached
// functions. Returns null until NEXT_PUBLIC_CONVEX_URL is configured.
export function getConvexHttpClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}
