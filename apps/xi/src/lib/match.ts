import { cacheLife, cacheTag } from "next/cache";
import { api } from "../../convex/_generated/api";
import { getConvexHttpClient } from "./convex-server";
import type { Match } from "./types";

// Today's match is the same for all users and changes once per UTC day, so it's
// an ideal `use cache` candidate. Tagged `daily-match` for manual invalidation.
export async function getTodaysMatch(): Promise<Match | null> {
  "use cache";
  cacheTag("daily-match");
  cacheLife("days");

  const client = getConvexHttpClient();
  if (!client) return null;

  const match = await client.query(api.matches.getTodaysMatch, {});
  return (match as Match | null) ?? null;
}
