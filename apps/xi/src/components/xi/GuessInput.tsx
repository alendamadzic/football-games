"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Match } from "@/lib/types";
import { normalize } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

interface Suggestion {
  displayName: string; // "Peter Schmeichel"
}

export function GuessInput({
  match,
  guessed,
  onGuess,
  disabled,
}: {
  match: Match;
  guessed: Set<string>;
  onGuess: (input: string) => "correct" | "wrong" | "duplicate";
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [flash, setFlash] = useState<"wrong" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pool = useMemo(() => {
    const list: { key: string; firstName: string; surname: string }[] = [];
    match.homePlayers.forEach((p, i) =>
      list.push({ key: `home-${i}`, firstName: p.name, surname: p.surname }),
    );
    match.awayPlayers.forEach((p, i) =>
      list.push({ key: `away-${i}`, firstName: p.name, surname: p.surname }),
    );
    return list;
  }, [match]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 150);
    return () => clearTimeout(id);
  }, [value]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = normalize(debounced);
    if (q.length < 2) return [];
    const seen = new Set<string>();
    const out: Suggestion[] = [];
    for (const p of pool) {
      if (guessed.has(p.key)) continue;
      const ns = normalize(p.surname);
      const nn = normalize(p.firstName);
      const full = `${nn} ${ns}`;
      if (!ns.includes(q) && !nn.includes(q) && !full.includes(q)) continue;
      const key = `${nn}-${ns}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ displayName: `${p.firstName} ${p.surname}` });
      if (out.length >= 6) break;
    }
    return out;
  }, [debounced, pool, guessed]);

  useEffect(() => setHighlight(0), [suggestions.length]);

  function submit(raw: string) {
    const input = raw.trim();
    if (!input) return;
    const result = onGuess(input);
    setValue("");
    setDebounced("");
    if (result === "wrong") {
      setFlash("wrong");
      setTimeout(() => setFlash(null), 500);
    }
    inputRef.current?.focus();
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
      submit(chosen ? chosen.displayName : value);
    } else if (e.key === "Escape") {
      setValue("");
      setDebounced("");
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Suggestions open upward so the mobile keyboard never covers them. */}
      {suggestions.length > 0 && !disabled && (
        <ul className="absolute bottom-full mb-2 w-full overflow-hidden rounded-lg border bg-popover shadow-lg z-20">
          {suggestions.map((s, i) => (
            <li key={s.displayName}>
              <button
                type="button"
                // onMouseDown (not onClick) so it fires before input blur.
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit(s.displayName);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-center px-3 py-2.5 text-left text-sm font-medium",
                  i === highlight ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                {s.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a name…"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={cn(
          "h-12 w-full rounded-lg border bg-card px-4 text-base outline-none transition-colors",
          "placeholder:text-muted-foreground focus-visible:border-primary",
          flash === "wrong" &&
            "border-destructive bg-destructive/10 animate-pulse",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      />
    </div>
  );
}
