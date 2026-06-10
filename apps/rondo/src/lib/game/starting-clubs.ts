/**
 * Curated pool of well-known global clubs used to seed a game (per the spec:
 * "major European clubs, South American giants … do not start with obscure
 * lower-league teams").
 *
 * We store names rather than ids/badges and resolve each against Transfermarkt at
 * game start (see getStartingClubAction), so the seed always carries the live,
 * canonical team id + badge — and id-based link verification stays consistent.
 */
export const STARTING_CLUB_NAMES: readonly string[] = [
  // England
  "Arsenal",
  "Chelsea",
  "Liverpool",
  "Manchester United",
  "Manchester City",
  "Tottenham",
  // Spain
  "Real Madrid",
  "Barcelona",
  "Atletico Madrid",
  "Valencia",
  "Sevilla",
  // Italy
  "Juventus",
  "AC Milan",
  "Inter Milan",
  "Napoli",
  "AS Roma",
  // Germany
  "Bayern Munich",
  "Borussia Dortmund",
  "Bayer Leverkusen",
  "RB Leipzig",
  // France
  "Paris SG",
  "Marseille",
  "Lyon",
  "Monaco",
  // Portugal & Netherlands
  "Benfica",
  "Porto",
  "Sporting CP",
  "Ajax",
  "PSV Eindhoven",
  // Rest of Europe
  "Celtic",
  "Galatasaray",
  // South America
  "Boca Juniors",
  "River Plate",
  "Flamengo",
  "Palmeiras",
  "Santos",
];

const SOUTH_AMERICAN_CLUBS = new Set([
  "Boca Juniors",
  "River Plate",
  "Flamengo",
  "Palmeiras",
  "Santos",
]);

/**
 * Which clubs are safe starting seeds for a given nationality restriction.
 *
 * South American clubs are excluded for European nationalities — they rarely
 * carry English, French, German etc. players — but are included for Argentine
 * and Brazilian since those are their home nations.
 *
 * If a nationality isn't listed here we fall back to the full pool.
 */
const NATIONALITY_ELIGIBLE_CLUBS: Partial<Record<string, readonly string[]>> =
  (() => {
    const european = STARTING_CLUB_NAMES.filter(
      (n) => !SOUTH_AMERICAN_CLUBS.has(n),
    );
    const all = [...STARTING_CLUB_NAMES];
    return {
      Argentine: all,
      Belgian: european,
      Brazilian: all,
      Dutch: european,
      English: european,
      French: european,
      German: european,
      Italian: european,
      Portuguese: european,
      Spanish: european,
    };
  })();

/**
 * Returns the pool of club names eligible as a starting seed given the active
 * nationality restriction (or the full pool when there is none).
 */
export function eligibleStartingClubNames(
  nationality: string | null,
): readonly string[] {
  if (!nationality) return STARTING_CLUB_NAMES;
  return NATIONALITY_ELIGIBLE_CLUBS[nationality] ?? STARTING_CLUB_NAMES;
}

/** A randomly shuffled copy of an eligible pool. */
export function shuffledStartingClubNames(
  nationality?: string | null,
): string[] {
  const names = [...eligibleStartingClubNames(nationality ?? null)];
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  return names;
}
