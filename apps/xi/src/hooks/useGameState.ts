"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { nameMatches } from "@/lib/fuzzy";
import type { Match, Player } from "@/lib/types";

export type GameStatus = "playing" | "won" | "lost";

const TOTAL_LIVES = 3;

// What the last guess did. `nonce` increments on every guess so that repeating
// the same outcome still re-triggers the feedback animations downstream.
export interface GuessEvent {
  kind: "correct" | "wrong" | "duplicate";
  keys: string[]; // player keys revealed (correct) or already held (duplicate)
  guess: string;
  nonce: number;
}

interface State {
  guessed: Set<string>; // keys of guessed players
  lives: number;
  wrongGuesses: string[];
  seconds: number;
  status: GameStatus;
  lastEvent: GuessEvent | null;
}

type Action =
  | { type: "CORRECT"; keys: string[]; guess: string }
  | { type: "WRONG"; guess: string }
  | { type: "DUPLICATE"; keys: string[]; guess: string }
  | { type: "TICK" }
  | { type: "GIVE_UP" }
  | { type: "RESTORE"; state: Partial<State> };

export function playerKey(team: "home" | "away", index: number): string {
  return `${team}-${index}`;
}

function event(
  state: State,
  action: Extract<Action, { type: "CORRECT" | "WRONG" | "DUPLICATE" }>,
): GuessEvent {
  return {
    kind:
      action.type === "CORRECT"
        ? "correct"
        : action.type === "WRONG"
          ? "wrong"
          : "duplicate",
    keys: action.type === "WRONG" ? [] : action.keys,
    guess: action.guess,
    nonce: (state.lastEvent?.nonce ?? 0) + 1,
  };
}

function reducer(state: State, action: Action, total: number): State {
  switch (action.type) {
    case "CORRECT": {
      const guessed = new Set(state.guessed);
      for (const k of action.keys) guessed.add(k);
      const status: GameStatus = guessed.size === total ? "won" : state.status;
      return { ...state, guessed, status, lastEvent: event(state, action) };
    }
    case "WRONG": {
      const lives = state.lives - 1;
      return {
        ...state,
        lives,
        wrongGuesses: [...state.wrongGuesses, action.guess],
        status: lives <= 0 ? "lost" : state.status,
        lastEvent: event(state, action),
      };
    }
    case "DUPLICATE":
      return { ...state, lastEvent: event(state, action) };
    case "TICK":
      return { ...state, seconds: state.seconds + 1 };
    case "GIVE_UP":
      return state.status === "playing"
        ? { ...state, status: "lost", lastEvent: null }
        : state;
    case "RESTORE":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

export interface GameApi {
  status: GameStatus;
  lives: number;
  totalLives: number;
  seconds: number;
  guessed: Set<string>;
  wrongGuesses: string[];
  score: number;
  total: number;
  lastEvent: GuessEvent | null;
  isGuessed: (team: "home" | "away", index: number) => boolean;
  guess: (input: string) => "correct" | "wrong" | "duplicate";
  giveUp: () => void;
}

export function useGameState(match: Match, persistKey?: string): GameApi {
  const total = match.homePlayers.length + match.awayPlayers.length;

  const initial: State = useMemo(
    () => ({
      guessed: new Set<string>(),
      lives: TOTAL_LIVES,
      wrongGuesses: [],
      seconds: 0,
      status: "playing",
      lastEvent: null,
    }),
    [],
  );

  const [state, dispatch] = useReducer(
    (s: State, a: Action) => reducer(s, a, total),
    initial,
  );

  // `hydrated` is state (not a ref) so the persist effect below cannot run
  // until the RESTORE dispatch has been applied. This prevents a mount-time
  // race where persisting the initial empty state would clobber saved progress
  // — important now that the same game is shared across multiple design routes.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!persistKey || typeof window === "undefined") {
      setHydrated(true);
      return;
    }
    const raw = window.localStorage.getItem(persistKey);
    if (raw) {
      try {
        const saved = JSON.parse(raw) as {
          guessed: string[];
          lives: number;
          wrongGuesses: string[];
          seconds: number;
          status: GameStatus;
        };
        dispatch({
          type: "RESTORE",
          state: { ...saved, guessed: new Set(saved.guessed) },
        });
      } catch {
        // Corrupt save — ignore and start fresh.
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  useEffect(() => {
    if (!hydrated || !persistKey || typeof window === "undefined") return;
    window.localStorage.setItem(
      persistKey,
      JSON.stringify({
        guessed: [...state.guessed],
        lives: state.lives,
        wrongGuesses: state.wrongGuesses,
        seconds: state.seconds,
        status: state.status,
      }),
    );
  }, [persistKey, state, hydrated]);

  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  // The clock only runs while the game is on screen. On a phone the player
  // switches apps constantly, and a timer that keeps ticking in the background
  // returns them to a wildly inflated time.
  useEffect(() => {
    if (state.status !== "playing") return;
    let id: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (id !== null) clearInterval(id);
      id = null;
    };
    const start = () => {
      if (id !== null) return;
      id = setInterval(() => {
        if (statusRef.current === "playing") dispatch({ type: "TICK" });
      }, 1000);
    };
    const sync = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [state.status]);

  const allPlayers = useMemo(() => {
    const list: { key: string; player: Player }[] = [];
    match.homePlayers.forEach((p, i) =>
      list.push({ key: playerKey("home", i), player: p }),
    );
    match.awayPlayers.forEach((p, i) =>
      list.push({ key: playerKey("away", i), player: p }),
    );
    return list;
  }, [match]);

  const guess = useCallback(
    (input: string): "correct" | "wrong" | "duplicate" => {
      if (statusRef.current !== "playing") return "wrong";
      const trimmed = input.trim();
      if (!trimmed) return "wrong";

      // Match against first name, surname, or full "First Surname" string.
      // Reveal all matching unguessed players at once (handles duplicate surnames).
      const hits = allPlayers.filter(
        ({ key, player }) =>
          !state.guessed.has(key) && nameMatches(trimmed, player),
      );

      if (hits.length > 0) {
        dispatch({
          type: "CORRECT",
          keys: hits.map((m) => m.key),
          guess: trimmed,
        });
        return "correct";
      }

      const already = allPlayers.filter(
        ({ key, player }) =>
          state.guessed.has(key) && nameMatches(trimmed, player),
      );
      if (already.length > 0) {
        dispatch({
          type: "DUPLICATE",
          keys: already.map((m) => m.key),
          guess: trimmed,
        });
        return "duplicate";
      }

      dispatch({ type: "WRONG", guess: trimmed });
      return "wrong";
    },
    [allPlayers, state.guessed],
  );

  const isGuessed = useCallback(
    (team: "home" | "away", index: number) =>
      state.guessed.has(playerKey(team, index)),
    [state.guessed],
  );

  const giveUp = useCallback(() => {
    dispatch({ type: "GIVE_UP" });
  }, []);

  return {
    status: state.status,
    lives: state.lives,
    totalLives: TOTAL_LIVES,
    seconds: state.seconds,
    guessed: state.guessed,
    wrongGuesses: state.wrongGuesses,
    score: state.guessed.size,
    total,
    lastEvent: state.lastEvent,
    isGuessed,
    guess,
    giveUp,
  };
}
