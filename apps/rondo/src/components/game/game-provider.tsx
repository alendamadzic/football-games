"use client";

import {
  createContext,
  type Dispatch,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { gameReducer } from "@/lib/game/reducer";
import type { GameAction, GameConfig, GameState, Mode } from "@/lib/game/types";
import {
  getStartingClubAction,
  verifyLinkAction,
} from "@/lib/sportsdb/actions";
import type { VerifyResult } from "@/lib/sportsdb/types";

function emptyState(mode: Mode): GameState {
  return {
    phase: "setup",
    mode,
    config: {
      mode,
      turnSeconds: 300,
      lives: 1,
      playerNames: mode === "arcade" ? ["You"] : ["", ""],
      restrictions: { nationality: null, position: null },
    },
    chain: [],
    turnKind: "player",
    usedClubIds: [],
    usedClubNames: [],
    usedPlayerIds: [],
    players: [],
    activePlayerIndex: 0,
    score: 0,
    lastElimination: null,
    winnerId: null,
  };
}

export type GameContextValue = {
  state: GameState;
  mode: Mode;
  dispatch: Dispatch<GameAction>;
  starting: boolean;
  startError: string | null;
  startGame: (config: GameConfig) => Promise<void>;
  resetToSetup: () => void;
  /** Verify a player↔club link. Memoized per (playerId, clubId) for the game. */
  verifyLink: (
    playerId: string,
    clubId: string,
    clubName: string,
  ) => Promise<VerifyResult>;

  // --- Online extensions (local/arcade providers supply the defaults below) ---
  /** True when state is driven by a Convex room rather than a local reducer. */
  isOnline: boolean;
  /** Whether the local device owns the current turn. Always true offline. */
  isMyTurn: boolean;
  /** Whether the local device is the room host. Always true offline. */
  isHost: boolean;
  /** Host-only: force-fail the current (likely absent) player's turn. Online only. */
  skipTurn?: () => void;
  /** Host-only: start a fresh game with the same players. Online only. */
  rematch?: () => void;
};

// Exported so the online provider can publish to the same context, letting the
// shared game components consume either backend through useGame().
export const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  mode,
  children,
}: {
  mode: Mode;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(gameReducer, mode, emptyState);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Per-game cache of verification results so the same link never re-hits the API.
  const verifyCache = useRef(new Map<string, VerifyResult>());

  const startGame = useCallback(async (config: GameConfig) => {
    setStarting(true);
    setStartError(null);
    verifyCache.current.clear();
    try {
      const seed = await getStartingClubAction(config.restrictions);
      if (!seed) {
        setStartError(
          "Couldn't reach the football database to pick a starting club. Check your connection and try again.",
        );
        return;
      }
      dispatch({
        type: "START",
        payload: {
          config,
          seed: { id: seed.id, name: seed.name, badge: seed.badge },
        },
      });
    } catch {
      setStartError(
        "Something went wrong starting the game. Please try again.",
      );
    } finally {
      setStarting(false);
    }
  }, []);

  const resetToSetup = useCallback(() => {
    verifyCache.current.clear();
    dispatch({ type: "RESET" });
  }, []);

  const verifyLink = useCallback(
    async (playerId: string, clubId: string, clubName: string) => {
      const key = `${playerId}:${clubId}`;
      const cached = verifyCache.current.get(key);
      if (cached) return cached;
      const result = await verifyLinkAction(playerId, clubId, clubName);
      // Only cache deterministic outcomes — let transient errors retry.
      if (result.status !== "error") verifyCache.current.set(key, result);
      return result;
    },
    [],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      mode,
      dispatch,
      starting,
      startError,
      startGame,
      resetToSetup,
      verifyLink,
      isOnline: false,
      isMyTurn: true,
      isHost: true,
    }),
    [state, mode, starting, startError, startGame, resetToSetup, verifyLink],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
