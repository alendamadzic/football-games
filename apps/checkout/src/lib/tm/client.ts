import "server-only";

import {
  getPlayerProfile,
  getPlayerStats,
  searchPlayers,
} from "@football/transfermarkt";
import type {
  TmProfileResponse,
  TmSearchResponse,
  TmStatsResponse,
} from "./types";

// Cold scrapes can take a while; give the API more room than the package
// default (8s) before giving up.
const TIMEOUT_MS = 45_000;

export function fetchPlayerSearch(query: string): Promise<TmSearchResponse> {
  return searchPlayers(query, {
    timeoutMs: TIMEOUT_MS,
    init: { next: { revalidate: 86_400 } },
  });
}

export function fetchPlayerStats(playerId: string): Promise<TmStatsResponse> {
  // Cold scrapes for long careers can flake once; a second attempt usually lands.
  return getPlayerStats(playerId, {
    timeoutMs: TIMEOUT_MS,
    attempts: 2,
    init: { next: { revalidate: 3_600 } },
  });
}

export function fetchPlayerProfile(
  playerId: string,
): Promise<TmProfileResponse> {
  return getPlayerProfile(playerId, {
    timeoutMs: TIMEOUT_MS,
    init: { next: { revalidate: 86_400 } },
  });
}
