"use server";

import { normalizePosition } from "@/lib/game/difficulty";
import { shuffledStartingClubNames } from "@/lib/game/starting-clubs";
import type { GameRestrictions } from "@/lib/game/types";
import {
  getClubSquad,
  getJerseyNumber,
  getPlayerClubs,
  normalizeClubName,
  searchPlayers,
  searchTeams,
} from "./client";
import type { ClubResult, PlayerResult, VerifyResult } from "./types";

/**
 * Returns true if the club's current squad contains at least one player
 * satisfying all active restrictions. Fails open (returns true) on API errors
 * so a network hiccup never silently blocks game start.
 */
async function clubHasValidAnswer(
  clubId: string,
  restrictions: GameRestrictions,
): Promise<boolean> {
  const { nationality, position } = restrictions;
  if (!nationality && !position) return true;
  try {
    const squad = await getClubSquad(clubId);
    return squad.some((p) => {
      if (nationality && p.nationality !== nationality) return false;
      if (position && normalizePosition(p.position) !== position) return false;
      return true;
    });
  } catch {
    return true;
  }
}

/**
 * Resolves a random well-known club to a live Transfermarkt record (canonical
 * id + badge) to seed a new game. When restrictions are active, walks the pool
 * until a club whose current squad has at least one matching player is found.
 */
export async function getStartingClubAction(
  restrictions?: GameRestrictions,
): Promise<ClubResult | null> {
  for (const name of shuffledStartingClubNames()) {
    try {
      const results = await searchTeams(name);
      if (results.length === 0) continue;
      const target = normalizeClubName(name);
      const exact = results.find((r) => normalizeClubName(r.name) === target);
      const pick = exact ?? results[0];
      if (!pick.badge) continue;
      if (
        restrictions &&
        !(await clubHasValidAnswer(pick.id, restrictions))
      ) {
        continue;
      }
      return pick;
    } catch {
      // Try the next club.
    }
  }
  return null;
}

/** Autocomplete action for "name a club" turns. */
export async function searchClubsAction(query: string): Promise<ClubResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    return await searchTeams(q);
  } catch {
    return [];
  }
}

/** Autocomplete action for "name a player" turns. */
export async function searchPlayersAction(
  query: string,
): Promise<PlayerResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    return await searchPlayers(q);
  } catch {
    return [];
  }
}

/**
 * Verifies that `playerId` played for the club identified by `clubId`/`clubName`.
 *
 * - `valid`        — the club is in the player's career set.
 * - `contradicted` — the API has career data, but this club is not in it → wrong link.
 * - `unconfirmed`  — the API has no career data for the player → strict re-enter.
 * - `error`        — the API call failed → let the player retry.
 *
 * Matching is by id OR normalized name, because the same club can carry
 * different ids across TheSportsDB endpoints.
 */
export async function verifyLinkAction(
  playerId: string,
  clubId: string,
  clubName: string,
): Promise<VerifyResult> {
  let knownClubs: Awaited<ReturnType<typeof getPlayerClubs>>;
  try {
    knownClubs = await getPlayerClubs(playerId);
  } catch {
    return { status: "error" };
  }

  if (knownClubs.length === 0) {
    return { status: "unconfirmed" };
  }

  const targetName = normalizeClubName(clubName);
  const matched = knownClubs.some(
    (club) => club.id === clubId || normalizeClubName(club.name) === targetName,
  );

  return matched ? { status: "valid" } : { status: "contradicted", knownClubs };
}

/**
 * Returns the jersey number a player wore at a specific club, or null if
 * unavailable. Non-blocking — callers should treat null as "not found".
 */
export async function getJerseyNumberAction(
  playerId: string,
  clubId: string,
): Promise<number | null> {
  try {
    return await getJerseyNumber(playerId, clubId);
  } catch {
    return null;
  }
}
