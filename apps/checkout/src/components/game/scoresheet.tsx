"use client";

import Image from "next/image";
import {
  type GuessedPlayer,
  MAX_VISIT,
  type TurnStatus,
} from "@/lib/game/engine";
import type { PlayerSearchItem } from "@/lib/tm/types";
import { cn } from "@/lib/utils";

/**
 * One chalked line on the sheet. Solo passes its GuessEntry[] straight in;
 * multiplayer adds `byName` (who threw) and uses `player: null` for turns the
 * clock forfeited.
 */
export interface ScoresheetRow {
  player: GuessedPlayer | null;
  status: TurnStatus;
  scoreAfter: number;
  byName?: string;
}

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

function RowVerdict({ row }: { row: ScoresheetRow }) {
  if (row.status === "timeout" || row.player === null) {
    return (
      <span className="animate-stamp-in font-marker text-sm text-treble">
        clocked out
      </span>
    );
  }
  const player = row.player;
  switch (row.status) {
    case "scored":
      return (
        <span className="flex items-baseline gap-3">
          <span
            className={cn(
              "font-display text-lg",
              player.apps === MAX_VISIT ? "text-primary" : "text-bed-green",
            )}
          >
            −{player.apps}
          </span>
          <span className="w-12 text-right font-display text-lg tabular-nums">
            {row.scoreAfter}
          </span>
        </span>
      );
    case "over":
      return (
        <span className="flex items-baseline gap-3">
          <span className="font-display text-lg text-muted-foreground line-through decoration-treble/70">
            {player.apps}
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
            {player.apps}
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

export function Scoresheet({
  entries,
  pending,
  pendingByName,
}: {
  entries: ScoresheetRow[];
  pending?: PlayerSearchItem | null;
  pendingByName?: string;
}) {
  if (entries.length === 0 && !pending) {
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
        {pending && (
          <li
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2.5",
              newestFirst.length > 0 && "border-b border-border/60",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <PlayerFace name={pending.name} imageUrl={null} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {pending.name}
                </span>
                {pendingByName && (
                  <span className="truncate text-xs text-muted-foreground">
                    {pendingByName}
                  </span>
                )}
              </span>
            </span>
            <span className="animate-board-flicker font-marker text-sm uppercase text-primary">
              VAR check…
            </span>
          </li>
        )}
        {newestFirst.map((row, index) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: visit rows have no stable id; the list only ever grows, so position is safe here.
            key={`visit-${newestFirst.length - index}`}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2.5",
              index !== newestFirst.length - 1 && "border-b border-border/60",
              row.status !== "scored" && "opacity-80",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              {row.player ? (
                <PlayerFace
                  name={row.player.name}
                  imageUrl={row.player.imageUrl}
                />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-secondary text-xs font-medium text-muted-foreground">
                  ⏱
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {row.player ? row.player.name : "no dart thrown"}
                </span>
                {row.byName && (
                  <span className="truncate text-xs text-muted-foreground">
                    {row.byName}
                  </span>
                )}
              </span>
            </span>
            <RowVerdict row={row} />
          </li>
        ))}
      </ul>
    </div>
  );
}
