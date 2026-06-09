/**
 * Curated pool of well-known global clubs used to seed a game (per the spec:
 * "major European clubs, South American giants … do not start with obscure
 * lower-league teams").
 *
 * We store names rather than ids/badges and resolve each against TheSportsDB at
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

/** A randomly shuffled copy of the pool, for resilient seed resolution. */
export function shuffledStartingClubNames(): string[] {
  const names = [...STARTING_CLUB_NAMES];
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  return names;
}
