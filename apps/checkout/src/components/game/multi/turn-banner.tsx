"use client";

import { useMultiGame } from "@/components/game/multi/game-context";
import { TimerRing } from "@/components/game/multi/timer-ring";
import { cn } from "@/lib/utils";

/** Whose throw it is — and the shot clock, when one is running. */
export function TurnBanner() {
  const { state, isMyTurn, turnDeadline, turnSeconds, roomCode } =
    useMultiGame();
  if (state.phase !== "playing") return null;

  const thrower = state.players[state.activeIndex];
  const isLocal = roomCode === null;

  const line = isLocal
    ? `${thrower.name} to throw`
    : isMyTurn
      ? "You're up"
      : `${thrower.name} is throwing…`;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-2.5",
        isMyTurn && !isLocal
          ? "border-primary/50 bg-secondary"
          : "border-border/60 bg-card/60",
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate font-marker text-base",
            isMyTurn || isLocal ? "text-primary" : "text-foreground/85",
          )}
        >
          {line}
        </span>
        <span className="text-xs text-muted-foreground">
          requires {thrower.score}
        </span>
      </span>
      {turnDeadline !== null && turnSeconds !== null && (
        <TimerRing deadline={turnDeadline} totalSeconds={turnSeconds} />
      )}
    </div>
  );
}
