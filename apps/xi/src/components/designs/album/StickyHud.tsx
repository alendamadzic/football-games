"use client";

import { Flag, HelpCircle, MoreVertical } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GameApi } from "@/hooks/useGameState";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Score, progress, lives and clock, pinned to the top. On a phone with the
 * keyboard up there is no room to scroll back to a masthead, so the numbers
 * that decide the game live here instead of in the album cover.
 */
export function StickyHud({
  game,
  over,
  onHelp,
  onGiveUp,
}: {
  game: GameApi;
  over: boolean;
  onHelp: () => void;
  onGiveUp: () => void;
}) {
  const pct = Math.round((game.score / game.total) * 100);

  return (
    <div
      data-xi-hud
      className="sticky top-0 z-40 border-b border-black/10 bg-[oklch(0.87_0.022_75)]/90 pt-[env(safe-area-inset-top)] backdrop-blur supports-backdrop-filter:bg-[oklch(0.87_0.022_75)]/75"
    >
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-3 py-2 sm:px-6 sm:py-2.5">
        <Link
          href="/"
          className="shrink-0 select-none text-xl font-extrabold tracking-tight"
        >
          xi<span className="text-primary">.</span>
        </Link>

        {/* score + progress — grows to fill, unlike the old fixed w-36 bar */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="flex items-baseline gap-1 leading-none">
              <span
                // Re-keying restarts the pulse on every collected sticker.
                key={game.score}
                className="animate-pop font-display text-xl leading-none tabular-nums sm:text-2xl"
              >
                {game.score}
              </span>
              <span className="font-display text-sm leading-none text-[oklch(0.24_0.028_60/.45)]">
                /{game.total}
              </span>
            </p>
            <div className="flex items-center gap-2 text-[oklch(0.4_0.03_60)]">
              <span
                key={game.lives}
                className={cn(
                  "flex gap-0.5",
                  game.lives < game.totalLives && "animate-shake",
                )}
                aria-hidden
              >
                {Array.from({ length: game.totalLives }).map((_, i) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length list of identical pips
                    key={i}
                    className={cn(
                      "text-sm leading-none",
                      i < game.lives ? "opacity-100" : "opacity-25 grayscale",
                    )}
                  >
                    ⚽
                  </span>
                ))}
              </span>
              <span className="text-xs font-bold tabular-nums">
                {formatTime(game.seconds)}
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[oklch(0.24_0.028_60/.15)]">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Game menu"
            className="grid size-11 shrink-0 place-items-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <MoreVertical className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-48">
            <DropdownMenuItem className="min-h-11 text-sm" onClick={onHelp}>
              <HelpCircle /> How to play
            </DropdownMenuItem>
            {!over && (
              <DropdownMenuItem
                className="min-h-11 text-sm"
                variant="destructive"
                onClick={onGiveUp}
              >
                <Flag /> Give up
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
