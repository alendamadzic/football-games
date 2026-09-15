import type {
  TmClubSearchResponse,
  TmJerseyNumbersResponse,
  TmPlayerProfile,
  TmPlayerSearchResponse,
  TmStatsResponse,
  TmTransfersResponse,
} from "./types";

const DEFAULT_BASE_URL = "https://transfermarkt-api-xi.vercel.app";

function baseUrl(): string {
  return process.env.TM_API_URL ?? DEFAULT_BASE_URL;
}

export interface TmFetchOptions {
  /** Abort timeout in ms. Defaults to 8000. */
  timeoutMs?: number;
  /** Retry this many times total on failure (>=1). Defaults to 1 (no retry). */
  attempts?: number;
  /** Passed straight through to fetch() — e.g. Next's `next: { revalidate }`. */
  init?: RequestInit & {
    next?: { revalidate?: number | false; tags?: string[] };
  };
}

/**
 * Low-level fetch against the shared transfermarkt-api deployment. Callers
 * that need Next's Cache Components (`"use cache"` + cacheLife/cacheTag)
 * apply those at their own call site — this stays framework-agnostic.
 */
export async function tmFetch<T>(
  path: string,
  options: TmFetchOptions = {},
): Promise<T> {
  const { timeoutMs = 8000, attempts = 1, init } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(`${baseUrl()}${path}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
        ...init,
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

/** Transfermarkt's CDN badge URL for a club, by id. */
export function clubBadgeUrl(clubId: string): string {
  return `https://tmssl.akamaized.net/images/wappen/normquad/${clubId}.png`;
}

export function searchClubs(
  query: string,
  options?: TmFetchOptions,
): Promise<TmClubSearchResponse> {
  return tmFetch(`/clubs/search/${encodeURIComponent(query)}`, options);
}

export function searchPlayers(
  query: string,
  options?: TmFetchOptions,
): Promise<TmPlayerSearchResponse> {
  return tmFetch(`/players/search/${encodeURIComponent(query)}`, options);
}

export function getPlayerStats(
  playerId: string,
  options?: TmFetchOptions,
): Promise<TmStatsResponse> {
  return tmFetch(`/players/${encodeURIComponent(playerId)}/stats`, options);
}

export function getPlayerProfile(
  playerId: string,
  options?: TmFetchOptions,
): Promise<TmPlayerProfile> {
  return tmFetch(`/players/${encodeURIComponent(playerId)}/profile`, options);
}

export function getPlayerTransfers(
  playerId: string,
  options?: TmFetchOptions,
): Promise<TmTransfersResponse> {
  return tmFetch(`/players/${encodeURIComponent(playerId)}/transfers`, options);
}

export function getJerseyNumbers(
  playerId: string,
  options?: TmFetchOptions,
): Promise<TmJerseyNumbersResponse> {
  return tmFetch(
    `/players/${encodeURIComponent(playerId)}/jersey_numbers`,
    options,
  );
}
