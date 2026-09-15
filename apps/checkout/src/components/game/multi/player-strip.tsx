"use client";

import { MAX_STRIKES, type MultiPlayer } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

/**
 * The pub scoreboard: one chalk column per player — name, remaining score,
 * strike dots. The active thrower gets the brass underline; the eliminated
 * get rubbed out.
 */
export function PlayerStrip({
  players,
  activeIndex,
  winnerIndex,
  mySeatIndex,
}: {
  players: MultiPlayer[];
  activeIndex: number;
  winnerIndex: number | null;
  mySeatIndex: number | null;
}) {
  return (
    <div className="grid w-full gap-2 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
      {players.map((player, index) => {
        const isActive = winnerIndex === null && index === activeIndex;
        const isWinner = index === winnerIndex;
        return (
          <div
            key={player.id}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-lg border px-2 py-3 transition-all duration-300",
              isActive
                ? "border-primary/60 bg-secondary shadow-[0_0_24px_-8px] shadow-primary/40"
                : "border-border/60 bg-card/60",
              isWinner && "border-primary bg-secondary",
              player.eliminated && "opacity-45",
            )}
          >
            <span
              className={cn(
                "max-w-full truncate font-marker text-sm leading-tight",
                isActive || isWinner ? "text-primary" : "text-foreground/85",
                player.eliminated &&
                  "line-through decoration-treble/80 decoration-2",
              )}
            >
              {player.name}
              {index === mySeatIndex && (
                <span className="text-muted-foreground"> ·you</span>
              )}
            </span>
            <span
              className={cn(
                "font-display text-3xl leading-none tabular-nums sm:text-4xl",
                player.score === 0 && "text-primary",
              )}
            >
              {player.score}
            </span>
            <span className="flex gap-1" aria-hidden>
              {Array.from({ length: MAX_STRIKES }, (_, slot) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed strike slots, never reordered
                  key={slot}
                  className={cn(
                    "font-marker text-xs leading-none",
                    slot < player.strikes
                      ? "text-treble"
                      : "text-muted-foreground/30",
                  )}
                >
                  ✗
                </span>
              ))}
            </span>
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
            <span className="sr-only">
              {player.strikes} strikes{player.eliminated && ", eliminated"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
