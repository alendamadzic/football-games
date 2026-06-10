import type { RestrictedPosition } from "./types";

const DYNAMIC_TIMER_BRACKETS = [
  { upToLink: 5, seconds: 60 },
  { upToLink: 15, seconds: 45 },
  { upToLink: Number.POSITIVE_INFINITY, seconds: 30 },
];

export function getDynamicSeconds(chainLength: number): number {
  for (const bracket of DYNAMIC_TIMER_BRACKETS) {
    if (chainLength <= bracket.upToLink) return bracket.seconds;
  }
  return 30;
}

export type NationEntry = {
  nationality: string;
  flag: string;
  /** Country name aliases as returned by the Transfermarkt API. */
  aliases?: string[];
};

export const MAJOR_NATIONS: NationEntry[] = [
  { nationality: "Argentine", flag: "🇦🇷", aliases: ["Argentina"] },
  { nationality: "Belgian", flag: "🇧🇪", aliases: ["Belgium"] },
  { nationality: "Brazilian", flag: "🇧🇷", aliases: ["Brazil"] },
  { nationality: "Dutch", flag: "🇳🇱", aliases: ["Netherlands"] },
  { nationality: "English", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", aliases: ["England"] },
  { nationality: "French", flag: "🇫🇷", aliases: ["France"] },
  { nationality: "German", flag: "🇩🇪", aliases: ["Germany"] },
  { nationality: "Italian", flag: "🇮🇹", aliases: ["Italy"] },
  { nationality: "Portuguese", flag: "🇵🇹", aliases: ["Portugal"] },
  { nationality: "Spanish", flag: "🇪🇸", aliases: ["Spain"] },
];

/** Returns just the nationality strings for backward-compat use in config. */
export const MAJOR_NATION_NAMES = MAJOR_NATIONS.map((n) => n.nationality);

export function getNationEntry(nationality: string): NationEntry | undefined {
  return MAJOR_NATIONS.find((n) => n.nationality === nationality);
}

/**
 * Resolves a raw nationality string (e.g. "Netherlands" from TM search results)
 * to the canonical restriction value (e.g. "Dutch"). Returns null if unrecognised.
 */
export function resolveNationality(raw: string | null): string | null {
  if (!raw) return null;
  const entry = MAJOR_NATIONS.find(
    (n) =>
      n.nationality === raw ||
      n.aliases?.some((a) => a.toLowerCase() === raw.toLowerCase()),
  );
  return entry?.nationality ?? null;
}

export type PositionEntry = {
  position: RestrictedPosition;
  abbr: string;
};

export const RESTRICTED_POSITIONS: RestrictedPosition[] = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Attacker",
];

export const POSITION_ENTRIES: PositionEntry[] = [
  { position: "Goalkeeper", abbr: "GK" },
  { position: "Defender", abbr: "DF" },
  { position: "Midfielder", abbr: "MF" },
  { position: "Attacker", abbr: "FW" },
];

export function getPositionEntry(
  position: RestrictedPosition,
): PositionEntry | undefined {
  return POSITION_ENTRIES.find((p) => p.position === position);
}

const POSITION_GROUPS: Record<string, RestrictedPosition> = {
  Goalkeeper: "Goalkeeper",
  "Centre-Back": "Defender",
  "Left-Back": "Defender",
  "Right-Back": "Defender",
  Defender: "Defender",
  "Defensive Midfield": "Midfielder",
  "Central Midfield": "Midfielder",
  "Attacking Midfield": "Midfielder",
  "Left Midfield": "Midfielder",
  "Right Midfield": "Midfielder",
  "Left Winger": "Midfielder",
  "Right Winger": "Midfielder",
  Midfield: "Midfielder",
  "Centre-Forward": "Attacker",
  "Second Striker": "Attacker",
  Forward: "Attacker",
  Attack: "Attacker",
};

export function normalizePosition(
  raw: string | null,
): RestrictedPosition | null {
  if (!raw) return null;
  return POSITION_GROUPS[raw] ?? null;
}
