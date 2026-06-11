// Relative (not "@/") so this pure module is importable from the Convex bundler,
// which does not resolve the app's path alias.
import { normalizeClubName } from "../sportsdb/normalize";
import type {
  ChainLink,
  GameAction,
  GamePlayer,
  GameState,
  StartPayload,
} from "./types";

/** Builds the initial playing state from setup config + the seed club. */
export function createInitialState({ config, seed }: StartPayload): GameState {
  const isArcade = config.mode === "arcade";
  const lives = isArcade ? 1 : Math.max(1, config.lives);

  const players: GamePlayer[] = isArcade
    ? [
        {
          id: "p0",
          name: config.playerNames[0] ?? "You",
          lives,
          eliminated: false,
        },
      ]
    : config.playerNames.map((name, i) => ({
        id: `p${i}`,
        name: name.trim() || `Player ${i + 1}`,
        lives,
        eliminated: false,
      }));

  const seedLink: ChainLink = {
    kind: "club",
    id: seed.id,
    name: seed.name,
    badge: seed.badge,
  };

  return {
    phase: "playing",
    mode: config.mode,
    config,
    chain: [seedLink],
    turnKind: "player",
    usedClubIds: [seed.id],
    usedClubNames: [normalizeClubName(seed.name)],
    usedPlayerIds: [],
    players,
    activePlayerIndex: 0,
    score: 0,
    lastElimination: null,
    winnerId: null,
  };
}

/** Next non-eliminated player index after `from`, or `from` if nobody else. */
function nextActiveIndex(players: GamePlayer[], from: number): number {
  for (let step = 1; step <= players.length; step++) {
    const idx = (from + step) % players.length;
    if (!players[idx].eliminated) return idx;
  }
  return from;
}

function aliveCount(players: GamePlayer[]): number {
  return players.filter((p) => !p.eliminated).length;
}

/** The most recent club in the chain — the reference for a "player" turn. */
export function referenceClub(state: GameState) {
  for (let i = state.chain.length - 1; i >= 0; i--) {
    const link = state.chain[i];
    if (link.kind === "club") return link;
  }
  return null;
}

/** The most recent player in the chain — the reference for a "club" turn. */
export function referencePlayer(state: GameState) {
  for (let i = state.chain.length - 1; i >= 0; i--) {
    const link = state.chain[i];
    if (link.kind === "player") return link;
  }
  return null;
}

export function activePlayer(state: GameState): GamePlayer | null {
  return state.players[state.activePlayerIndex] ?? null;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START":
      return createInitialState(action.payload);

    case "SUBMIT_VALID": {
      const link = action.link;
      const nextTurn = state.turnKind === "player" ? "club" : "player";
      const isArcade = state.mode === "arcade";

      return {
        ...state,
        chain: [...state.chain, link],
        turnKind: nextTurn,
        score: state.score + 1,
        usedClubIds:
          link.kind === "club"
            ? [...state.usedClubIds, link.id]
            : state.usedClubIds,
        usedClubNames:
          link.kind === "club"
            ? [...state.usedClubNames, normalizeClubName(link.name)]
            : state.usedClubNames,
        usedPlayerIds:
          link.kind === "player"
            ? [...state.usedPlayerIds, link.id]
            : state.usedPlayerIds,
        activePlayerIndex: isArcade
          ? state.activePlayerIndex
          : nextActiveIndex(state.players, state.activePlayerIndex),
      };
    }

    case "FAIL": {
      const current = state.players[state.activePlayerIndex];
      if (!current) return state;

      // Arcade: any failure ends the run.
      if (state.mode === "arcade") {
        return {
          ...state,
          phase: "gameover",
          lastElimination: {
            playerId: current.id,
            playerName: current.name,
            attempted: action.attempted,
            reason: action.reason,
            eliminated: true,
            livesLeft: 0,
            knownClubs: action.knownClubs,
          },
        };
      }

      // Local: lose a life; eliminate when lives are exhausted.
      const livesLeft = current.lives - 1;
      const eliminated = livesLeft <= 0;
      const players = state.players.map((p, i) =>
        i === state.activePlayerIndex
          ? { ...p, lives: Math.max(0, livesLeft), eliminated }
          : p,
      );

      return {
        ...state,
        phase: "elimination",
        players,
        lastElimination: {
          playerId: current.id,
          playerName: current.name,
          attempted: action.attempted,
          reason: action.reason,
          eliminated,
          livesLeft: Math.max(0, livesLeft),
          knownClubs: action.knownClubs,
        },
      };
    }

    case "CONTINUE": {
      // Leaves the elimination interstitial. The chain reference is unchanged,
      // so the next player owes the SAME answer type (turnKind stays put).
      const alive = aliveCount(state.players);
      if (alive <= 1) {
        const winner = state.players.find((p) => !p.eliminated) ?? null;
        return { ...state, phase: "gameover", winnerId: winner?.id ?? null };
      }
      return {
        ...state,
        phase: "playing",
        activePlayerIndex: nextActiveIndex(
          state.players,
          state.activePlayerIndex,
        ),
      };
    }

    case "RESET":
      return { ...state, phase: "setup" };

    default:
      return state;
  }
}
