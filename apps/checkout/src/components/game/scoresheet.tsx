"use client";

import Image from "next/image";
import { type GuessEntry, MAX_VISIT } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

function PlayerFace({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  if (!imageUrl) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-secondary text-xs font-medium text-muted-foreground">
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <Image
      src={imageUrl}
      alt=""
      width={32}
      height={32}
      className="size-8 shrink-0 rounded-sm object-cover"
    />
  );
}

function EntryVerdict({ entry }: { entry: GuessEntry }) {
  switch (entry.status) {
    case "scored":
      return (
        <span className="flex items-baseline gap-3">
          <span
            className={cn(
              "font-display text-lg",
              entry.player.apps === MAX_VISIT
                ? "text-primary"
                : "text-bed-green",
            )}
          >
            −{entry.player.apps}
          </span>
          <span className="w-12 text-right font-display text-lg tabular-nums">
            {entry.scoreAfter}
          </span>
        </span>
      );
    case "over":
      return (
        <span className="flex items-baseline gap-3">
          <span className="font-display text-lg text-muted-foreground line-through decoration-treble/70">
            {entry.player.apps}
          </span>
          <span className="animate-stamp-in font-marker text-sm uppercase text-treble">
            over {MAX_VISIT}
          </span>
        </span>
      );
    case "bust":
      return (
        <span className="flex items-baseline gap-3">
          <span className="font-display text-lg text-muted-foreground line-through decoration-treble/70">
            {entry.player.apps}
          </span>
          <span className="animate-stamp-in font-marker text-sm uppercase text-treble">
            bust
          </span>
        </span>
      );
    case "invalid":
      return (
        <span className="animate-stamp-in font-marker text-sm text-treble">
          no show
        </span>
      );
    case "duplicate":
      return (
        <span className="animate-stamp-in font-marker text-sm text-treble">
          repeat
        </span>
      );
  }
}

export function Scoresheet({ entries }: { entries: GuessEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        The sheet is clean. First name gets chalked up here.
      </div>
    );
  }

  const newestFirst = [...entries].reverse();

  return (
    <div className="overflow-hidden rounded-lg border bg-card/60">
      <div className="flex items-center justify-between border-b px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>scoresheet</span>
        <span className="flex gap-3">
          <span>scored</span>
          <span className="w-12 text-right">left</span>
        </span>
      </div>
      <ul>
        {newestFirst.map((entry, index) => (
          <li
            key={`visit-${newestFirst.length - index}`}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2.5",
              index !== newestFirst.length - 1 && "border-b border-border/60",
              entry.status !== "scored" && "opacity-80",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <PlayerFace
                name={entry.player.name}
                imageUrl={entry.player.imageUrl}
              />
              <span className="truncate text-sm font-medium">
                {entry.player.name}
              </span>
            </span>
            <EntryVerdict entry={entry} />
          </li>
        ))}
      </ul>
    </div>
  );
}
