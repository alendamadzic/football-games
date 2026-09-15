"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

const PLACEHOLDER_NAMES = [
  "Big Al",
  "The Doctor",
  "Bullseye",
  "Stevie Chalk",
  "Madhouse Mo",
  "Low Ton Lena",
];

export function LocalSetup({
  onStart,
}: {
  onStart: (names: string[]) => void;
}) {
  const [names, setNames] = useState<string[]>(["", ""]);

  const setName = (index: number, value: string) => {
    setNames((current) =>
      current.map((name, i) => (i === index ? value : name)),
    );
  };

  const trimmed = names.map((name) => name.trim());
  const ready = trimmed.every((name) => name.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-display text-5xl leading-none tracking-wide sm:text-6xl">
          round the table<span className="text-primary">.</span>
        </h1>
        <p className="max-w-sm text-balance text-muted-foreground">
          Chalk up who&apos;s playing. You&apos;ll pass the phone — one name a
          turn, three strikes and you&apos;re rubbed out.
        </p>
      </header>

      <div className="flex w-full flex-col gap-2">
        {names.map((name, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional seats
            key={index}
            className="flex items-center gap-2"
          >
            <span className="w-8 shrink-0 text-right font-display text-lg text-muted-foreground">
              {index + 1}
            </span>
            <Input
              value={name}
              onChange={(event) => setName(index, event.target.value)}
              placeholder={PLACEHOLDER_NAMES[index % PLACEHOLDER_NAMES.length]}
              maxLength={20}
              className="bg-card"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove player ${index + 1}`}
              disabled={names.length <= MIN_PLAYERS}
              onClick={() =>
                setNames((current) => current.filter((_, i) => i !== index))
              }
              className={cn(
                "text-muted-foreground",
                names.length <= MIN_PLAYERS && "invisible",
              )}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          disabled={names.length >= MAX_PLAYERS}
          onClick={() => setNames((current) => [...current, ""])}
          className="mt-1"
        >
          Add a player
        </Button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button size="lg" disabled={!ready} onClick={() => onStart(trimmed)}>
          Pick the board
        </Button>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {MIN_PLAYERS}–{MAX_PLAYERS} throwers · nearest the bull goes first
        </p>
      </div>
    </div>
  );
}
