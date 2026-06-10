import { cacheLife, cacheTag } from "next/cache";
import { normalizeClubName } from "./normalize";
import type {
  CareerClub,
  ClubResult,
  PlayerResult,
  TmClubPlayersResponse,
  TmClubSearchResponse,
  TmJerseyNumbersResponse,
  TmPlayerProfile,
  TmPlayerSearchResponse,
  TmTransfersResponse,
} from "./types";

const BASE = "https://transfermarkt-api-xi.vercel.app";

export { normalizeClubName };

/** Constructs a Transfermarkt CDN badge URL for a club. */
function clubBadgeUrl(clubId: string): string {
  return `https://tmssl.akamaized.net/images/wappen/normquad/${clubId}.png`;
}

// Matches youth, reserve, B-team, and other non-senior suffixes/patterns.
const NON_SENIOR_PATTERN =
  /\b(u\d{2}|under[-\s]?\d{2}|reserve|reserves|youth|academy|development|b\s*team|castilla|filial)\b|\s[bbc]\s*$|\s(ii|iii|iv|v)\s*$/i;

// Matches women's/girls' team name indicators across multiple languages.
const WOMENS_PATTERN =
  /\b(women|womens|ladies|girls|female|femenin[ao]|feminin[ae]|feminino|dames|frauen|femmes|mujer|naiset)\b/i;

function isNonSeniorClub(name: string): boolean {
  return NON_SENIOR_PATTERN.test(name) || WOMENS_PATTERN.test(name);
}

async function tmFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Transfermarkt API request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Autocomplete: search clubs by (partial) name. Cached for a day. */
export async function searchTeams(query: string): Promise<ClubResult[]> {
  "use cache";
  cacheLife("days");
  cacheTag("tm-teams", `tm-teams-${query.toLowerCase()}`);

  const data = await tmFetch<TmClubSearchResponse>(
    `/clubs/search/${encodeURIComponent(query)}`,
  );
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

  const data = await tmFetch<TmPlayerSearchResponse>(
    `/players/search/${encodeURIComponent(query)}`,
  );
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
    const transfers = await tmFetch<TmTransfersResponse>(
      `/players/${encodeURIComponent(playerId)}/transfers`,
    );
    for (const t of transfers.transfers ?? []) {
      addClub(t.clubFrom?.id, t.clubFrom?.name);
      addClub(t.clubTo?.id, t.clubTo?.name);
    }
  } catch {
    // Fall through to profile lookup.
  }

  // Current club — catches one-club players with no transfer history.
  try {
    const profile = await tmFetch<TmPlayerProfile>(
      `/players/${encodeURIComponent(playerId)}/profile`,
    );
    addClub(profile.club?.id, profile.club?.name);
  } catch {
    // Ignore.
  }

  return [...clubs.values()];
}

/**
 * Current squad for a club, used to verify at least one player satisfies active
 * restrictions before accepting the club as a starting seed. Cached for a day.
 */
export async function getClubSquad(
  clubId: string,
): Promise<{ nationality: string | null; position: string | null }[]> {
  "use cache";
  cacheLife("days");
  cacheTag("tm-squad", `tm-squad-${clubId}`);

  const data = await tmFetch<TmClubPlayersResponse>(
    `/clubs/${encodeURIComponent(clubId)}/players`,
  );
  return (data.players ?? []).map((p) => ({
    nationality: p.nationalities?.[0] ?? null,
    position: p.position ?? null,
  }));
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

  const data = await tmFetch<TmJerseyNumbersResponse>(
    `/players/${encodeURIComponent(playerId)}/jersey_numbers`,
  );

  // Jersey numbers are returned most-recent-first; take the first match.
  const entry = (data.jerseyNumbers ?? []).find((j) => j.club === clubId);
  return entry?.jerseyNumber ?? null;
}
