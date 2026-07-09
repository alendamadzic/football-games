export interface PlayerSearchItem {
  playerId: string;
  name: string;
  position: string | null;
  clubName: string | null;
  age: number | null;
  nationalities: string[];
}

export interface CompetitionBreakdown {
  competitionId: string;
  competitionName: string;
  appearances: number;
}

export type ResolveGuessResult =
  | {
      ok: true;
      playerId: string;
      name: string;
      imageUrl: string | null;
      apps: number;
      breakdown: CompetitionBreakdown[];
    }
  | { ok: false; error: "lookup_failed" };

/** Raw shapes returned by the transfermarkt-api fork. */
export interface TmSearchResponse {
  results?: {
    id: string;
    name: string;
    position?: string;
    club?: { id?: string; name?: string };
    age?: number;
    nationalities?: string[];
  }[];
}

export interface TmStatsResponse {
  id: string;
  stats?: {
    competitionId: string;
    competitionName: string;
    seasonId: string;
    clubId: string;
    appearances?: number;
    goals?: number;
    assists?: number;
    minutesPlayed?: number;
  }[];
}

export interface TmProfileResponse {
  id: string;
  name?: string;
  imageUrl?: string;
}
