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
    .filter((t) => t.strSport === SOCCER)
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
    .filter((p) => p.strSport === SOCCER)
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
    if (player?.idTeam && player.strTeam && !player.strTeam.startsWith("_")) {
      clubs.set(player.idTeam, { id: player.idTeam, name: player.strTeam });
    }
  } catch {
    // Ignore — former teams alone is usually enough.
  }

  return [...clubs.values()];
}
