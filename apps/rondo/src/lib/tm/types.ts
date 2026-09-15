/**
 * Normalized, UI-facing shapes derived from the raw Transfermarkt API
 * responses (see @football/transfermarkt for the wire types).
 */

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
