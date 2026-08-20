"use client";

import { Star } from "lucide-react";
import type { GameApi } from "@/hooks/useGameState";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Pure album cover. Score, lives and clock used to live here and scroll away
 * on a phone — they're in the sticky HUD now, so this is just the masthead.
 */
export function Masthead({
  match,
  game,
  over,
}: {
  match: Match;
  game: GameApi;
  over: boolean;
}) {
  const won = game.status === "won";
  const year = match.date.match(/\d{4}/)?.[0] ?? "";

  return (
    <header className="relative mb-3 border-b-4 border-[oklch(0.24_0.028_60)] pb-2.5 sm:mb-5 sm:pb-4">
      <div className="text-center sm:text-left">
        <p className="flex items-center justify-center gap-1.5 text-[0.6rem] font-black uppercase tracking-[0.25em] text-[oklch(0.45_0.04_60)] sm:justify-start">
          <Star className="size-3 fill-current" /> Official Sticker Collection ·
          No. {year} <Star className="size-3 fill-current" />
        </p>
        <h1 className="print-offset mt-1 text-balance font-display text-[clamp(1.5rem,7.4vw,2.25rem)] uppercase leading-[0.88] sm:text-6xl">
          {match.homeTeam}
          <span className="mx-1.5 text-primary">v</span>
          {match.awayTeam}
        </h1>
        <p className="mt-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-[oklch(0.45_0.04_60)] sm:text-xs">
          {match.competition}
          {over && (
            <span className="ml-1 text-[oklch(0.24_0.028_60)]">
              · Final {match.score}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs font-semibold italic text-[oklch(0.42_0.06_40)] sm:text-sm">
          “{match.title}”
        </p>

        {over && (
          <span
            className={cn(
              // Sits in the flow on a phone (a centred stamp under the title)
              // and pins to the free bottom-right corner from sm, where it
              // clears the wide display title.
              "mt-2 inline-block rotate-6 rounded border-2 px-2.5 py-1 font-display text-lg uppercase tracking-wide shadow-sm",
              "sm:absolute sm:bottom-2 sm:right-3 sm:mt-0 sm:text-2xl",
              won
                ? "border-primary bg-primary/10 text-primary"
                : "border-destructive bg-destructive/10 text-destructive",
            )}
          >
            {won ? "Complete!" : `Incomplete · ${game.score}/${game.total}`}
          </span>
        )}
      </div>
    </header>
  );
}
