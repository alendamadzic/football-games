"use client";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@football/ui/components/command";
import { cn } from "@football/ui/lib/utils";
import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchPlayers } from "@/lib/tm/actions";
import type { PlayerSearchItem } from "@/lib/tm/types";

interface GuessInputProps {
  subjectName: string;
  usedPlayerIds: string[];
  disabled: boolean;
  onGuess: (item: PlayerSearchItem) => void;
}

export function GuessInput({
  subjectName,
  usedPlayerIds,
  disabled,
  onGuess,
}: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const seq = ++requestSeq.current;
    const timer = setTimeout(async () => {
      const items = await searchPlayers(trimmed);
      if (requestSeq.current === seq) {
        setResults(items);
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const showList = query.trim().length >= 2 && !disabled;

  return (
    <Command
      shouldFilter={false}
      className={cn(
        "overflow-visible rounded-lg! border bg-card shadow-lg shadow-black/20",
        disabled && "opacity-70",
      )}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={`Name ${/^[AEIOU]/.test(subjectName) ? "an" : "a"} ${subjectName} player…`}
        disabled={disabled}
      />
      {showList && (
        <CommandList>
          {searching && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Searching the register…
            </div>
          )}
          {!searching && results.length === 0 && (
            <CommandEmpty>No player found by that name.</CommandEmpty>
          )}
          {!searching &&
            results.map((item) => {
              const used = usedPlayerIds.includes(item.playerId);
              return (
                <CommandItem
                  key={item.playerId}
                  value={item.playerId}
                  disabled={used}
                  onSelect={() => {
                    setQuery("");
                    setResults([]);
                    onGuess(item);
                  }}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[
                        item.position,
                        item.clubName,
                        item.age ? `${item.age}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {used ? (
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-treble">
                      on the sheet
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.nationalities.slice(0, 2).join(", ")}
                    </span>
                  )}
                </CommandItem>
              );
            })}
        </CommandList>
      )}
    </Command>
  );
}
