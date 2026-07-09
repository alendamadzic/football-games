export const STARTING_SCORE = 501;
export const MAX_STRIKES = 3;
/** Darts' maximum visit — the appearance ceiling when the 180 rule is on. */
export const MAX_VISIT = 180;

export type GuessStatus = "scored" | "bust" | "invalid" | "duplicate" | "over";

export type GamePhase = "playing" | "won" | "lost";

export interface GuessedPlayer {
  playerId: string;
  name: string;
  imageUrl: string | null;
  /** Total appearances for the round's subject. 0 means they never played for it. */
  apps: number;
}

export interface GuessEntry {
  player: GuessedPlayer;
  status: GuessStatus;
  scoreBefore: number;
  scoreAfter: number;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  strikes: number;
  guesses: GuessEntry[];
  /** When on, any player with more than MAX_VISIT appearances is a strike. */
  limit180: boolean;
}

export function createGame(
  startScore: number = STARTING_SCORE,
  limit180 = false,
): GameState {
  return {
    phase: "playing",
    score: startScore,
    strikes: 0,
    guesses: [],
    limit180,
  };
}

export function isPlayerUsed(state: GameState, playerId: string): boolean {
  return state.guesses.some((guess) => guess.player.playerId === playerId);
}

function guessStatus(state: GameState, player: GuessedPlayer): GuessStatus {
  if (isPlayerUsed(state, player.playerId)) return "duplicate";
  if (player.apps === 0) return "invalid";
  if (state.limit180 && player.apps > MAX_VISIT) return "over";
  if (player.apps > state.score) return "bust";
  return "scored";
}

export function applyGuess(state: GameState, player: GuessedPlayer): GameState {
  if (state.phase !== "playing") return state;

  const status = guessStatus(state, player);
  const scoreAfter =
    status === "scored" ? state.score - player.apps : state.score;
  const strikes = status === "scored" ? state.strikes : state.strikes + 1;

  const phase: GamePhase =
    scoreAfter === 0 ? "won" : strikes >= MAX_STRIKES ? "lost" : "playing";

  return {
    ...state,
    phase,
    score: scoreAfter,
    strikes,
    guesses: [
      ...state.guesses,
      { player, status, scoreBefore: state.score, scoreAfter },
    ],
  };
}
