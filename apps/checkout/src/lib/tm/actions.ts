"use server";

import {
  fetchPlayerProfile,
  fetchPlayerSearch,
  fetchPlayerStats,
} from "./client";
import type {
  CompetitionBreakdown,
  PlayerSearchItem,
  ResolveGuessResult,
} from "./types";

export async function searchPlayers(
  query: string,
): Promise<PlayerSearchItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  try {
    const response = await fetchPlayerSearch(trimmed);
    return (response.results ?? []).slice(0, 8).map((result) => ({
      playerId: result.id,
      name: result.name,
      position: result.position ?? null,
      clubName: result.club?.name ?? null,
      age: result.age ?? null,
      nationalities: result.nationalities ?? [],
    }));
  } catch {
    return [];
  }
}

export async function resolveGuess(
  playerId: string,
  subjectClubId: string,
): Promise<ResolveGuessResult> {
  try {
    const [stats, profile] = await Promise.all([
      fetchPlayerStats(playerId),
      fetchPlayerProfile(playerId).catch(() => null),
    ]);

    const subjectRows = (stats.stats ?? []).filter(
      (row) => row.clubId === subjectClubId,
    );

    const byCompetition = new Map<string, CompetitionBreakdown>();
    for (const row of subjectRows) {
      const existing = byCompetition.get(row.competitionId);
      const appearances = row.appearances ?? 0;
      if (existing) {
        existing.appearances += appearances;
      } else {
        byCompetition.set(row.competitionId, {
          competitionId: row.competitionId,
          competitionName: row.competitionName,
          appearances,
        });
      }
    }
    const breakdown = [...byCompetition.values()]
      .filter((competition) => competition.appearances > 0)
      .sort((a, b) => b.appearances - a.appearances);

    return {
      ok: true,
      playerId,
      name: profile?.name ?? "",
      imageUrl: profile?.imageUrl ?? null,
      apps: breakdown.reduce(
        (total, competition) => total + competition.appearances,
        0,
      ),
      breakdown,
    };
  } catch {
    return { ok: false, error: "lookup_failed" };
  }
}
