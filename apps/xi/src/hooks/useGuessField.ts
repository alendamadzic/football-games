"use client";

import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { buildPool, buildSuggestions } from "@/lib/suggest";
import type { Match } from "@/lib/types";

export type GuessResult = "correct" | "wrong" | "duplicate";

// Headless logic for the "type a name" guess field, shared across every design
// so each one only has to render its own markup. Manages the input value,
// debounced autocomplete, keyboard navigation and a transient feedback flash.
export function useGuessField(
  match: Match,
  guessed: Set<string>,
  onGuess: (input: string) => GuessResult,
) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [flash, setFlash] = useState<GuessResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pool = useMemo(() => buildPool(match), [match]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 120);
    return () => clearTimeout(id);
  }, [value]);

  const suggestions = useMemo(
    () => buildSuggestions(pool, guessed, debounced),
    [pool, guessed, debounced],
  );

  // Reset the highlighted suggestion whenever the result set changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: length is the intended trigger
  useEffect(() => setHighlight(0), [suggestions.length]);

  function submit(raw: string): GuessResult | undefined {
    const input = raw.trim();
    if (!input) return;
    const result = onGuess(input);
    setValue("");
    setDebounced("");
    setFlash(result);
    setTimeout(() => setFlash(null), 650);
    inputRef.current?.focus();
    return result;
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = suggestions[highlight];
      submit(chosen ?? value);
    } else if (e.key === "Escape") {
      setValue("");
      setDebounced("");
    }
  }

  return {
    value,
    setValue,
    suggestions,
    highlight,
    setHighlight,
    flash,
    inputRef,
    submit,
    onKeyDown,
  };
}
