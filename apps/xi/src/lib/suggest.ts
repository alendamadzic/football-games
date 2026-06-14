import { normalize } from "./fuzzy";
import type { Match } from "./types";

export interface PoolEntry {
  key: string;
  // `name` in the dataset holds the full display name (e.g. "Manuel Neuer");
  // `surname` is the matchable last name. We display fullName and match on both.
  fullName: string;
  surname: string;
}

// Flatten both XIs into a single lookup pool keyed like the game state.
export function buildPool(match: Match): PoolEntry[] {
  const list: PoolEntry[] = [];
  match.homePlayers.forEach((p, i) => {
    list.push({ key: `home-${i}`, fullName: p.name, surname: p.surname });
  });
  match.awayPlayers.forEach((p, i) => {
    list.push({ key: `away-${i}`, fullName: p.name, surname: p.surname });
  });
  return list;
}

// Substring autocomplete over not-yet-guessed players. Deduped by full name.
export function buildSuggestions(
  pool: PoolEntry[],
  guessed: Set<string>,
  query: string,
  limit = 6,
): string[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of pool) {
    if (guessed.has(p.key)) continue;
    const ns = normalize(p.surname);
    const nn = normalize(p.fullName);
    if (!ns.includes(q) && !nn.includes(q)) continue;
    if (seen.has(nn)) continue;
    seen.add(nn);
    out.push(p.fullName);
    if (out.length >= limit) break;
  }
  return out;
}
