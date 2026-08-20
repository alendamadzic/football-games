import type { Player } from "./types";

// e.g. "4-4-2" — outfield counts only, the classic shorthand.
export function formationLabel(players: Player[]): string {
  const counts = { DEF: 0, MID: 0, FWD: 0 } as Record<string, number>;
  for (const p of players) if (p.position in counts) counts[p.position]++;
  return [counts.DEF, counts.MID, counts.FWD].filter(Boolean).join("-");
}
