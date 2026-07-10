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

// ── Multiplayer (darts-style, turn-based) ──────────────────────────────
// Everyone throws at the same board: one shared subject, one shared pool of
// names. Misses are personal strikes; three rub you off the board. First to
// exactly zero checks out and ends the game on the spot.
//
// This section must stay pure and import-free: Convex mutations bundle it
// directly (see convex/rooms.ts) and re-run it as the authority for remote
// games.

/** A turn that scores nothing. "timeout" is remote-only: the shot clock ran out. */
export type TurnStatus = GuessStatus | "timeout";

export interface MultiPlayer {
  /** Seat id — local mode uses "p1".., remote mode uses the device id. */
  id: string;
  name: string;
  score: number;
  strikes: number;
  eliminated: boolean;
}

export interface MultiGuessEntry {
  seatIndex: number;
  /** null only when the clock forfeited the turn — no dart was thrown. */
  player: GuessedPlayer | null;
  status: TurnStatus;
  scoreBefore: number;
  scoreAfter: number;
}

export type MultiEndReason = "checkout" | "last-standing" | "all-out";

export interface MultiGameState {
  phase: "playing" | "over";
  players: MultiPlayer[];
  activeIndex: number;
  /** Shared pool: any name anyone has thrown is burned for the whole table. */
  usedPlayerIds: string[];
  guesses: MultiGuessEntry[];
  /** null while playing, and on an all-out dead heat. */
  winnerIndex: number | null;
  endReason: MultiEndReason | null;
  limit180: boolean;
}

export type MultiTurnAction =
  | { type: "guess"; player: GuessedPlayer }
  | { type: "timeout" };

export function createMultiGame(
  names: string[],
  startScore: number = STARTING_SCORE,
  limit180 = false,
): MultiGameState {
  return {
    phase: "playing",
    players: names.map((name, index) => ({
      id: `p${index + 1}`,
      name,
      score: startScore,
      strikes: 0,
      eliminated: false,
    })),
    activeIndex: 0,
    usedPlayerIds: [],
    guesses: [],
    winnerIndex: null,
    endReason: null,
    limit180,
  };
}

function multiGuessStatus(
  state: MultiGameState,
  thrower: MultiPlayer,
  player: GuessedPlayer,
): GuessStatus {
  if (state.usedPlayerIds.includes(player.playerId)) return "duplicate";
  if (player.apps === 0) return "invalid";
  if (state.limit180 && player.apps > MAX_VISIT) return "over";
  if (player.apps > thrower.score) return "bust";
  return "scored";
}

function nextAliveIndex(players: MultiPlayer[], from: number): number {
  for (let step = 1; step <= players.length; step++) {
    const index = (from + step) % players.length;
    if (!players[index].eliminated) return index;
  }
  return from;
}

export function applyTurn(
  state: MultiGameState,
  action: MultiTurnAction,
): MultiGameState {
  if (state.phase !== "playing") return state;

  const seatIndex = state.activeIndex;
  const thrower = state.players[seatIndex];

  const status: TurnStatus =
    action.type === "timeout"
      ? "timeout"
      : multiGuessStatus(state, thrower, action.player);

  const scoreAfter =
    status === "scored" && action.type === "guess"
      ? thrower.score - action.player.apps
      : thrower.score;
  const strikes = status === "scored" ? thrower.strikes : thrower.strikes + 1;

  const players = state.players.map((player, index) =>
    index === seatIndex
      ? {
          ...player,
          score: scoreAfter,
          strikes,
          eliminated: player.eliminated || strikes >= MAX_STRIKES,
        }
      : player,
  );

  const entry: MultiGuessEntry = {
    seatIndex,
    player: action.type === "guess" ? action.player : null,
    status,
    scoreBefore: thrower.score,
    scoreAfter,
  };

  // A thrown name is consumed even when it misses — same as the solo sheet.
  const usedPlayerIds =
    action.type === "guess"
      ? [...state.usedPlayerIds, action.player.playerId]
      : state.usedPlayerIds;

  const next: MultiGameState = {
    ...state,
    players,
    usedPlayerIds,
    guesses: [...state.guesses, entry],
  };

  if (scoreAfter === 0) {
    return {
      ...next,
      phase: "over",
      winnerIndex: seatIndex,
      endReason: "checkout",
    };
  }

  const alive = players.flatMap((player, index) =>
    player.eliminated ? [] : [index],
  );

  if (alive.length === 1) {
    return {
      ...next,
      phase: "over",
      winnerIndex: alive[0],
      endReason: "last-standing",
    };
  }

  if (alive.length === 0) {
    // Everyone struck out. Nearest the checkout takes it; a tie is a dead heat.
    const lowest = Math.min(...players.map((player) => player.score));
    const nearest = players.flatMap((player, index) =>
      player.score === lowest ? [index] : [],
    );
    return {
      ...next,
      phase: "over",
      winnerIndex: nearest.length === 1 ? nearest[0] : null,
      endReason: "all-out",
    };
  }

  return { ...next, activeIndex: nextAliveIndex(players, seatIndex) };
}

/** Seat indexes ranked 1st → last: the winner, then nearest-the-checkout. */
export function placings(state: MultiGameState): number[] {
  const seats = state.players.map((_, index) => index);
  return seats.sort((a, b) => {
    if (a === state.winnerIndex) return -1;
    if (b === state.winnerIndex) return 1;
    const byScore = state.players[a].score - state.players[b].score;
    if (byScore !== 0) return byScore;
    const byStrikes = state.players[a].strikes - state.players[b].strikes;
    if (byStrikes !== 0) return byStrikes;
    return a - b;
  });
}
