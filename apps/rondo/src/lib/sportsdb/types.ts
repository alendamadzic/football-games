/**
 * Typed shapes for the Transfermarkt API
 * (https://github.com/felipeall/transfermarkt-api). Only the fields rondo
 * actually uses are modelled.
 */

export type TmClub = {
  id: string;
  name: string;
  country?: string | null;
  marketValue?: number | null;
};

export type TmPlayer = {
  id: string;
  name: string;
  position?: string | null;
  club?: { id: string; name: string } | null;
  age?: number | null;
  nationalities?: string[] | null;
  marketValue?: number | null;
};

export type TmTransfer = {
  id: string;
  clubFrom: { id: string; name: string } | null;
  clubTo: { id: string; name: string } | null;
  date?: string | null;
  season?: string | null;
};

export type TmPlayerProfile = {
  id: string;
  name: string;
  club?: { id: string; name: string } | null;
};

export type TmJerseyNumber = {
  season: string;
  club: string;
  jerseyNumber: number;
};

export type TmClubSearchResponse = {
  results: TmClub[];
  page: number;
  lastPage: number;
};
export type TmPlayerSearchResponse = {
  results: TmPlayer[];
  page: number;
  lastPage: number;
};
export type TmTransfersResponse = {
  id: string;
  transfers: TmTransfer[];
  updatedAt: string;
};
export type TmJerseyNumbersResponse = {
  id: string;
  jerseyNumbers: TmJerseyNumber[];
  updatedAt: string;
};

export type TmClubPlayersResponse = {
  players: TmPlayer[];
};

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
  /** Current team id, when known. */
  teamId: string | null;
  teamName: string | null;
  position: string | null;
  nationality: string | null;
};

/** One club in a player's career, used for link verification. */
export type CareerClub = { id: string; name: string };

/** Outcome of verifying that a player played for a club. */
export type VerifyResult =
  | { status: "valid" }
  | { status: "contradicted"; knownClubs: CareerClub[] }
  | { status: "unconfirmed" }
  | { status: "error" };
