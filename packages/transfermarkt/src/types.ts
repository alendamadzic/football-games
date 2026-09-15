/**
 * Raw wire shapes returned by the transfermarkt-api service
 * (apps/transfermarkt-api, forked from
 * https://github.com/felipeall/transfermarkt-api). Only the fields the
 * three games actually consume are modelled — treat this as a living
 * subset, not the full API surface.
 */

export interface TmClub {
  id: string;
  url?: string;
  name: string;
  country?: string | null;
  squad?: number;
  marketValue?: number | null;
}

export interface TmClubSearchResponse {
  updatedAt?: string;
  query?: string;
  pageNumber?: number;
  lastPageNumber?: number;
  results?: TmClub[];
}

export interface TmPlayer {
  id: string;
  name: string;
  position?: string | null;
  club?: { id?: string; name?: string } | null;
  age?: number | null;
  nationalities?: string[] | null;
  marketValue?: number | null;
}

export interface TmPlayerSearchResponse {
  updatedAt?: string;
  query?: string;
  pageNumber?: number;
  lastPageNumber?: number;
  results?: TmPlayer[];
}

export interface TmPlayerStatRow {
  competitionId: string;
  competitionName: string;
  seasonId: string;
  clubId: string;
  appearances?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  minutesPlayed?: number;
}

export interface TmStatsResponse {
  id: string;
  stats?: TmPlayerStatRow[];
}

export interface TmPlayerProfile {
  id: string;
  name?: string;
  imageUrl?: string;
  club?: {
    id: string;
    name: string;
    joined?: string;
    contractExpires?: string;
  } | null;
}

export interface TmTransfer {
  id: string;
  clubFrom: { id: string; name: string } | null;
  clubTo: { id: string; name: string } | null;
  date?: string | null;
  season?: string | null;
}

export interface TmTransfersResponse {
  id: string;
  transfers: TmTransfer[];
  updatedAt: string;
}

export interface TmJerseyNumber {
  season: string;
  club: string;
  jerseyNumber: number;
}

export interface TmJerseyNumbersResponse {
  id: string;
  jerseyNumbers: TmJerseyNumber[];
  updatedAt: string;
}
