import { cn } from "@football/ui/lib/utils";
import { Heart } from "lucide-react";
import type { GamePlayer } from "@/lib/game/types";

export function PlayerRoster({
  players,
  activeIndex,
  showLives,
}: {
  players: GamePlayer[];
  activeIndex: number;
  showLives: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {players.map((player, i) => {
        const active = i === activeIndex && !player.eliminated;
        return (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all",
              player.eliminated
                ? "border-border/60 text-muted-foreground line-through opacity-60"
                : active
                  ? "border-primary bg-primary/10 font-semibold text-foreground ring-1 ring-primary/40"
                  : "border-border text-foreground",
            )}
          >
            {active && (
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            )}
            <span className="max-w-[10rem] truncate">{player.name}</span>
            {showLives && !player.eliminated && (
              <span className="flex items-center gap-0.5">
                {Array.from({ length: player.lives }).map((_, h) => (
                  <Heart
                    // biome-ignore lint/suspicious/noArrayIndexKey: hearts are positional and interchangeable.
                    key={h}
                    className="size-3 fill-primary text-primary"
                    aria-hidden
                  />
                ))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
