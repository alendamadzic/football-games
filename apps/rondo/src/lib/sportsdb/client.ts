import { cacheLife, cacheTag } from "next/cache";
import { normalizeClubName } from "./normalize";
import type {
  CareerClub,
  ClubResult,
  PlayerResult,
  SdbFormerTeamsResponse,
  SdbLookupPlayerResponse,
  SdbSearchPlayersResponse,
  SdbSearchTeamsResponse,
} from "./types";

// The free, public, key-less tier. `123` is the documented public key.
const BASE = "https://www.thesportsdb.com/api/v1/json/123";
const SOCCER = "Soccer";

export { normalizeClubName };

// Matches youth, reserve, B-team, and other non-senior suffixes/patterns.
const NON_SENIOR_PATTERN =
  /\b(u\d{2}|under[-\s]?\d{2}|reserve|reserves|youth|academy|development|b\s*team|castilla|filial)\b|\s[bbc]\s*$|\s(ii|iii|iv|v)\s*$/i;

// Leagues TheSportsDB uses for national/international squads.
const INTERNATIONAL_LEAGUE_PATTERN = /international/i;

// Matches women's/girls' team name indicators across multiple languages.
const WOMENS_PATTERN =
  /\b(women|womens|ladies|girls|female|femenin[ao]|feminin[ae]|feminino|dames|frauen|femmes|mujer|naiset)\b/i;

/** Returns true for youth, reserve, B-team, national/international, or women's sides. */
function isNonSeniorClub(
  name: string,
  league: string | null,
  country: string | null,
): boolean {
  if (NON_SENIOR_PATTERN.test(name)) return true;
  if (WOMENS_PATTERN.test(name)) return true;
  if (league && INTERNATIONAL_LEAGUE_PATTERN.test(league)) return true;
  if (league && WOMENS_PATTERN.test(league)) return true;
  // National teams: team name matches or is contained in the country name.
  if (country) {
    const normName = name.trim().toLowerCase();
    const normCountry = country.trim().toLowerCase();
    if (normName === normCountry || normCountry === normName) return true;
  }
  return false;
}

/** Name-only variant used where league/country data is unavailable. */
function isNonSeniorClubByName(name: string): boolean {
  return isNonSeniorClub(name, null, null);
}

async function sdbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`TheSportsDB request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Autocomplete: search clubs by (partial) name. Cached for a day. */
export async function searchTeams(query: string): Promise<ClubResult[]> {
  "use cache";
  cacheLife("days");
  cacheTag("sdb-teams", `sdb-teams-${query.toLowerCase()}`);

  const data = await sdbFetch<SdbSearchTeamsResponse>(
    `searchteams.php?t=${encodeURIComponent(query)}`,
  );
  return (data.teams ?? [])
    .filter(
      (t) =>
        t.strSport === SOCCER &&
        !isNonSeniorClub(t.strTeam, t.strLeague, t.strCountry),
    )
    .map((t) => ({
      id: t.idTeam,
      name: t.strTeam,
      badge: t.strBadge,
      league: t.strLeague,
      country: t.strCountry,
    }));
}

/** Autocomplete: search players by (partial) name. Cached for a day. */
export async function searchPlayers(query: string): Promise<PlayerResult[]> {
  "use cache";
  cacheLife("days");
  cacheTag("sdb-players", `sdb-players-${query.toLowerCase()}`);

  const data = await sdbFetch<SdbSearchPlayersResponse>(
    `searchplayers.php?p=${encodeURIComponent(query)}`,
  );
  return (data.player ?? [])
    .filter(
      (p) =>
        p.strSport === SOCCER &&
        p.strGender !== "Female",
    )
    .map((p) => ({
      id: p.idPlayer,
      name: p.strPlayer,
      teamId: p.idTeam,
      teamName: p.strTeam,
      position: p.strPosition,
      nationality: p.strNationality,
      image: p.strCutout ?? p.strThumb,
    }));
}

/**
 * The full set of clubs a player has been part of — current team plus every
 * former team (loans included by the API). This is the backbone of link
 * verification, so it is cached aggressively (career history is near-static).
 *
 * Returns an empty array when the API has no career data for the player, which
 * the action layer treats as "unconfirmed" rather than "wrong".
 */
export async function getPlayerClubs(playerId: string): Promise<CareerClub[]> {
  "use cache";
  cacheLife("weeks");
  cacheTag("sdb-career", `sdb-career-${playerId}`);

  const clubs = new Map<string, CareerClub>();

  // Former teams — the authoritative career-history endpoint.
  try {
    const former = await sdbFetch<SdbFormerTeamsResponse>(
      `lookupformerteams.php?id=${encodeURIComponent(playerId)}`,
    );
    for (const t of former.formerteams ?? []) {
      if (t.strSport && t.strSport !== SOCCER) continue;
      if (isNonSeniorClubByName(t.strFormerTeam)) continue;
      clubs.set(t.idFormerTeam, {
        id: t.idFormerTeam,
        name: t.strFormerTeam,
      });
    }
  } catch {
    // Ignore — fall back to whatever the current-team lookup provides.
  }

  // Current team — not always present in former-teams (e.g. active players).
  try {
    const lookup = await sdbFetch<SdbLookupPlayerResponse>(
      `lookupplayer.php?id=${encodeURIComponent(playerId)}`,
    );
    const player = lookup.players?.[0];
    // Skip placeholder teams like "_Free Agent" / "_Retired".
    if (
      player?.idTeam &&
      player.strTeam &&
      !player.strTeam.startsWith("_") &&
      !isNonSeniorClubByName(player.strTeam)
    ) {
      clubs.set(player.idTeam, { id: player.idTeam, name: player.strTeam });
    }
  } catch {
    // Ignore — former teams alone is usually enough.
  }

  return [...clubs.values()];
}
