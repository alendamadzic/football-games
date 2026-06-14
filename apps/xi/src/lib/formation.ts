import type { Player, Position } from "./types";

export interface PositionedPlayer {
  player: Player;
  index: number; // original index within the team's XI (for game-state keys)
}

const ROW_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];

// Group an XI into formation rows (GK → DEF → MID → FWD), preserving each
// player's original index so it still maps to the game-state key. Empty rows
// are dropped so a 4-4-2 and a 3-5-2 both render naturally.
export function formationRows(players: Player[]): PositionedPlayer[][] {
  const buckets: Record<Position, PositionedPlayer[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
  players.forEach((player, index) => {
    buckets[player.position].push({ player, index });
  });
  return ROW_ORDER.map((pos) => buckets[pos]).filter((row) => row.length > 0);
}

// e.g. "4-4-2" — outfield counts only, the classic shorthand.
export function formationLabel(players: Player[]): string {
  const counts = { DEF: 0, MID: 0, FWD: 0 } as Record<string, number>;
  for (const p of players) if (p.position in counts) counts[p.position]++;
  return [counts.DEF, counts.MID, counts.FWD].filter(Boolean).join("-");
}
