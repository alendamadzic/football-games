"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { Match, Player } from "@/lib/types";
import { nameMatches } from "@/lib/fuzzy";

export type GameStatus = "playing" | "won" | "lost";

const TOTAL_LIVES = 3;

interface State {
  guessed: Set<string>; // keys of guessed players
  lives: number;
  wrongGuesses: string[];
  seconds: number;
  status: GameStatus;
}

type Action =
  | { type: "CORRECT"; keys: string[] }
  | { type: "WRONG"; guess: string }
  | { type: "TICK" }
  | { type: "RESTORE"; state: Partial<State> };

export function playerKey(team: "home" | "away", index: number): string {
  return `${team}-${index}`;
}

function reducer(state: State, action: Action, total: number): State {
  switch (action.type) {
    case "CORRECT": {
      const guessed = new Set(state.guessed);
      for (const k of action.keys) guessed.add(k);
      const status: GameStatus = guessed.size === total ? "won" : state.status;
      return { ...state, guessed, status };
    }
    case "WRONG": {
      const lives = state.lives - 1;
      return {
        ...state,
        lives,
        wrongGuesses: [...state.wrongGuesses, action.guess],
        status: lives <= 0 ? "lost" : state.status,
      };
    }
    case "TICK":
      return { ...state, seconds: state.seconds + 1 };
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
  isGuessed: (team: "home" | "away", index: number) => boolean;
  guess: (input: string) => "correct" | "wrong" | "duplicate";
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
    }),
    [],
  );

  const [state, dispatch] = useReducer(
    (s: State, a: Action) => reducer(s, a, total),
    initial,
  );

  const restored = useRef(false);
  useEffect(() => {
    if (!persistKey || typeof window === "undefined") {
      restored.current = true;
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
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  useEffect(() => {
    if (!persistKey || !restored.current || typeof window === "undefined") return;
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
  }, [persistKey, state]);

  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  useEffect(() => {
    if (state.status !== "playing") return;
    const id = setInterval(() => {
      if (statusRef.current === "playing") dispatch({ type: "TICK" });
    }, 1000);
    return () => clearInterval(id);
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
        dispatch({ type: "CORRECT", keys: hits.map((m) => m.key) });
        return "correct";
      }

      const already = allPlayers.some(
        ({ key, player }) =>
          state.guessed.has(key) && nameMatches(trimmed, player),
      );
      if (already) return "duplicate";

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

  return {
    status: state.status,
    lives: state.lives,
    totalLives: TOTAL_LIVES,
    seconds: state.seconds,
    guessed: state.guessed,
    wrongGuesses: state.wrongGuesses,
    score: state.guessed.size,
    total,
    isGuessed,
    guess,
  };
}
