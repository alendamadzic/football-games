import "server-only";

import type {
  TmProfileResponse,
  TmSearchResponse,
  TmStatsResponse,
} from "./types";

const BASE_URL =
  process.env.TM_API_URL ?? "https://transfermarkt-api-xi.vercel.app";

async function tmFetch<T>(
  path: string,
  revalidateSeconds: number,
  attempts = 1,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) {
        throw new Error(`Transfermarkt API ${res.status} for ${path}`);
      }
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export function fetchPlayerSearch(query: string): Promise<TmSearchResponse> {
  return tmFetch(`/players/search/${encodeURIComponent(query)}`, 86_400);
}

export function fetchPlayerStats(playerId: string): Promise<TmStatsResponse> {
  // Cold scrapes for long careers can flake once; a second throw usually lands.
  return tmFetch(`/players/${encodeURIComponent(playerId)}/stats`, 3_600, 2);
}

export function fetchPlayerProfile(
  playerId: string,
): Promise<TmProfileResponse> {
  return tmFetch(`/players/${encodeURIComponent(playerId)}/profile`, 86_400);
}
