"use client";

import type { Player } from "@/lib/types";
import { nationalityFlag } from "@/lib/nationality";
import { cn } from "@/lib/utils";

export function PlayerSlot({
  player,
  guessed,
  revealed,
}: {
  player: Player;
  guessed: boolean;
  revealed?: boolean;
}) {
  const show = guessed || revealed;
  const missed = revealed && !guessed;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 min-h-11 py-2 transition-colors",
        guessed &&
          "border-primary/40 bg-primary/10 animate-in fade-in slide-in-from-bottom-1",
        missed && "border-destructive/40 bg-destructive/10",
        !show && "bg-muted/40 border-dashed",
      )}
    >
      {/* Squad number — always visible */}
      <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-foreground/70">
        {player.number}
      </span>

      {/* Position — always visible */}
      <span className="shrink-0 w-8 text-xs font-semibold text-muted-foreground">
        {player.position}
      </span>

      {/* Nationality flag — always visible, tooltip for country name */}
      <span
        title={player.nationality}
        aria-label={player.nationality}
        className="shrink-0 text-base leading-none cursor-default select-none"
      >
        {nationalityFlag(player.nationality)}
      </span>

      {/* Name — only when guessed or revealed post-game */}
      {show ? (
        <p className="min-w-0 flex-1 truncate font-semibold">
          {player.name} {player.surname}
        </p>
      ) : (
        <span className="flex-1 text-muted-foreground/30 text-sm select-none">
          —
        </span>
      )}

      {/* Result indicator */}
      {show && (
        <span
          className={cn(
            "shrink-0 text-[0.625rem] font-bold uppercase tracking-wider",
            guessed ? "text-primary" : "text-destructive",
          )}
        >
          {guessed ? "✓" : "Missed"}
        </span>
      )}
    </div>
  );
}
