import {
  clubBadgeUrl,
  getJerseyNumbers as tmGetJerseyNumbers,
  getPlayerProfile as tmGetPlayerProfile,
  getPlayerTransfers as tmGetPlayerTransfers,
  searchClubs as tmSearchClubs,
  searchPlayers as tmSearchPlayers,
} from "@football/transfermarkt";
import { cacheLife, cacheTag } from "next/cache";
import { normalizeClubName } from "./normalize";
import type { CareerClub, ClubResult, PlayerResult } from "./types";

export { normalizeClubName };

// Matches youth, reserve, B-team, and other non-senior suffixes/patterns.
const NON_SENIOR_PATTERN =
  /\b(u\d{2}|under[-\s]?\d{2}|reserve|reserves|youth|academy|development|b\s*team|castilla|filial)\b|\s[bbc]\s*$|\s(ii|iii|iv|v)\s*$/i;

// Matches women's/girls' team name indicators across multiple languages.
const WOMENS_PATTERN =
  /\b(women|womens|ladies|girls|female|femenin[ao]|feminin[ae]|feminino|dames|frauen|femmes|mujer|naiset)\b/i;

function isNonSeniorClub(name: string): boolean {
  return NON_SENIOR_PATTERN.test(name) || WOMENS_PATTERN.test(name);
}

/** Autocomplete: search clubs by (partial) name. Cached for a day. */
export async function searchTeams(query: string): Promise<ClubResult[]> {
  "use cache";
  cacheLife("days");
  cacheTag("tm-teams", `tm-teams-${query.toLowerCase()}`);

  const data = await tmSearchClubs(query);
  return (data.results ?? [])
    .filter((t) => !isNonSeniorClub(t.name))
    .map((t) => ({
      id: t.id,
      name: t.name,
      badge: clubBadgeUrl(t.id),
      league: null,
      country: t.country ?? null,
    }));
}

/** Autocomplete: search players by (partial) name. Cached for a day. */
export async function searchPlayers(query: string): Promise<PlayerResult[]> {
  "use cache";
  cacheLife("days");
  cacheTag("tm-players", `tm-players-${query.toLowerCase()}`);

  const data = await tmSearchPlayers(query);
  return (data.results ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    teamId: p.club?.id ?? null,
    teamName: p.club?.name ?? null,
    position: p.position ?? null,
    nationality: p.nationalities?.[0] ?? null,
  }));
}

/**
 * The full set of clubs a player has been part of, derived from their
 * complete transfer history plus current club. Cached aggressively as career
 * history is near-static.
 */
export async function getPlayerClubs(playerId: string): Promise<CareerClub[]> {
  "use cache";
  cacheLife("weeks");
  cacheTag("tm-career", `tm-career-${playerId}`);

  const clubs = new Map<string, CareerClub>();

  const addClub = (
    id: string | undefined | null,
    name: string | undefined | null,
  ) => {
    if (!id || !name || isNonSeniorClub(name)) return;
    clubs.set(id, { id, name });
  };

  // Full transfer history — both legs of each transfer.
  try {
    const transfers = await tmGetPlayerTransfers(playerId);
    for (const t of transfers.transfers ?? []) {
      addClub(t.clubFrom?.id, t.clubFrom?.name);
      addClub(t.clubTo?.id, t.clubTo?.name);
    }
  } catch {
    // Fall through to profile lookup.
  }

  // Current club — catches one-club players with no transfer history.
  try {
    const profile = await tmGetPlayerProfile(playerId);
    addClub(profile.club?.id, profile.club?.name);
  } catch {
    // Ignore.
  }

  return [...clubs.values()];
}

/**
 * Returns the jersey number a player wore at a specific club, or null if
 * unavailable. Used as a non-blocking UI enhancement on player chain cards.
 */
export async function getJerseyNumber(
  playerId: string,
  clubId: string,
): Promise<number | null> {
  "use cache";
  cacheLife("weeks");
  cacheTag("tm-jersey", `tm-jersey-${playerId}`);

  const data = await tmGetJerseyNumbers(playerId);

  // Jersey numbers are returned most-recent-first; take the first match.
  const entry = (data.jerseyNumbers ?? []).find((j) => j.club === clubId);
  return entry?.jerseyNumber ?? null;
}
