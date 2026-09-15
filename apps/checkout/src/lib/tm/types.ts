export type {
  TmPlayerProfile as TmProfileResponse,
  TmPlayerSearchResponse as TmSearchResponse,
  TmStatsResponse,
} from "@football/transfermarkt";

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
