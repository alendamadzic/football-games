"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";

export type GuessResult = "correct" | "wrong" | "duplicate";

async function fetchSuggestions(
  query: string,
  limit: number,
  signal: AbortSignal,
): Promise<string[] | null> {
  if (query.length < 2) return [];
  try {
    const res = await fetch(
      `/api/players/search?q=${encodeURIComponent(query)}`,
      { signal },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: { name?: string }[];
    };
    return (data.results ?? [])
      .map((r) => r.name ?? "")
      .filter(Boolean)
      .slice(0, limit);
  } catch {
    // `null` means "superseded or failed" — leave the current list alone
    // rather than blanking it, which on a flaky mobile connection reads as
    // the autocomplete breaking.
    return signal.aborted ? null : [];
  }
}

// Headless logic for the "type a name" guess field: input value, debounced
// autocomplete, keyboard navigation and a transient feedback flash.
export function useGuessField(
  onGuess: (input: string) => GuessResult,
  { limit = 6 }: { limit?: number } = {},
) {
  const [value, setValue] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [flash, setFlash] = useState<GuessResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const results = await fetchSuggestions(
        value.trim(),
        limit,
        controller.signal,
      );
      if (results === null) return; // a newer keystroke took over
      setSuggestions(results);
      setHighlight(0);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, limit]);

  function submit(raw: string): GuessResult | undefined {
    const input = raw.trim();
    if (!input) return;
    const result = onGuess(input);
    setValue("");
    setSuggestions([]);
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
      setSuggestions([]);
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
