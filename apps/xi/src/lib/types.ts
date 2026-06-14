export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface Player {
  name: string;
  surname: string;
  position: Position;
  number: number;
  nationality: string;
}

export interface Match {
  slug: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  date: string;
  score: string;
  scorers: string;
  homePlayers: Player[];
  awayPlayers: Player[];
}
