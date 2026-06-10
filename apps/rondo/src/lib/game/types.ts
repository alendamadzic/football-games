import type { CareerClub } from "@/lib/sportsdb/types";

export type Mode = "local" | "arcade";

/** The kind of answer the active player must provide next. */
export type TurnKind = "player" | "club";

export type GamePhase = "setup" | "playing" | "elimination" | "gameover";

export type FailReason = "wrong" | "timeout" | "gaveup";

/** One node in the Club → Player → Club chain. */
export type ChainLink =
  | { kind: "club"; id: string; name: string; badge: string | null }
  | {
      kind: "player";
      id: string;
      name: string;
      /** Club ID the player was linked through — used to look up jersey number. */
      linkedClubId: string | null;
      teamName: string | null;
    };

export type GamePlayer = {
  id: string;
  name: string;
  lives: number;
  eliminated: boolean;
};

export type GameConfig = {
  mode: Mode;
  /** Seconds per turn (local) or for the whole session (arcade). null = off. */
  turnSeconds: number | null;
  /** Starting lives per player (local only; arcade is always 1). */
  lives: number;
  /** Player names (local). Arcade ignores this. */
  playerNames: string[];
};

export type EliminationInfo = {
  playerId: string;
  playerName: string;
  /** What the player attempted (their typed/selected answer), if any. */
  attempted: string | null;
  reason: FailReason;
  /** True if the player is out of the game; false if they only lost a life. */
  eliminated: boolean;
  livesLeft: number;
  /** Known career clubs, surfaced as a hint after a wrong link. */
  knownClubs?: CareerClub[];
};

export type GameState = {
  phase: GamePhase;
  mode: Mode;
  config: GameConfig;
  chain: ChainLink[];
  turnKind: TurnKind;
  usedClubIds: string[];
  usedClubNames: string[];
  usedPlayerIds: string[];
  players: GamePlayer[];
  activePlayerIndex: number;
  /** Arcade score = number of successful links. */
  score: number;
  lastElimination: EliminationInfo | null;
  winnerId: string | null;
};

export type StartPayload = {
  config: GameConfig;
  seed: { id: string; name: string; badge: string | null };
};

export type GameAction =
  | { type: "START"; payload: StartPayload }
  | { type: "SUBMIT_VALID"; link: ChainLink }
  | {
      type: "FAIL";
      reason: FailReason;
      attempted: string | null;
      knownClubs?: CareerClub[];
    }
  | { type: "CONTINUE" }
  | { type: "RESET" };
