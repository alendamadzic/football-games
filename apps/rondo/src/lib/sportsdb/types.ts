/**
 * Minimal typed shapes for the TheSportsDB v1 free API
 * (https://www.thesportsdb.com/api/v1/json/123/). Only the fields rondo.
 * actually uses are modelled; the live API returns many more.
 */

export type SdbTeam = {
  idTeam: string;
  strTeam: string;
  strLeague: string | null;
  strBadge: string | null;
  strCountry: string | null;
  strSport: string | null;
};

export type SdbPlayer = {
  idPlayer: string;
  idTeam: string | null;
  strPlayer: string;
  strTeam: string | null;
  strSport: string | null;
  strPosition: string | null;
  strNationality: string | null;
  strThumb: string | null;
  strCutout: string | null;
  strStatus: string | null;
};

export type SdbFormerTeam = {
  idPlayer: string;
  idFormerTeam: string;
  strFormerTeam: string;
  strSport: string | null;
  strJoined: string | null;
  strDeparted: string | null;
  strBadge: string | null;
};

export type SdbSearchTeamsResponse = { teams: SdbTeam[] | null };
export type SdbSearchPlayersResponse = { player: SdbPlayer[] | null };
export type SdbFormerTeamsResponse = { formerteams: SdbFormerTeam[] | null };
export type SdbLookupPlayerResponse = { players: SdbPlayer[] | null };

/** A normalized, UI-friendly club suggestion. */
export type ClubResult = {
  id: string;
  name: string;
  badge: string | null;
  league: string | null;
  country: string | null;
};

/** A normalized, UI-friendly player suggestion. */
export type PlayerResult = {
  id: string;
  name: string;
  /** Current team id, when known (placeholder ids exist for retired players). */
  teamId: string | null;
  teamName: string | null;
  position: string | null;
  nationality: string | null;
  image: string | null;
};

/** One club in a player's career, used for link verification. */
export type CareerClub = { id: string; name: string };

/** Outcome of verifying that a player played for a club. */
export type VerifyResult =
  | { status: "valid" }
  | { status: "contradicted"; knownClubs: CareerClub[] }
  | { status: "unconfirmed" }
  | { status: "error" };
