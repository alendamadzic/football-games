"use client";

import { Confetti } from "@/components/game/end-overlay";
import { useMultiGame } from "@/components/game/multi/game-context";
import { Button } from "@/components/ui/button";
import { placings } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

const PLACE_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

function headline(reason: string, winnerName: string | null) {
  switch (reason) {
    case "checkout":
      return { title: "checkout!", sub: `${winnerName} takes it. Game shot.` };
    case "last-standing":
      return {
        title: "last one standing",
        sub: `The rest threw themselves off the board. ${winnerName} wins it.`,
      };
    default:
      return winnerName
        ? {
            title: "all out",
            sub: `Nobody found zero — ${winnerName} wins on countback, nearest the checkout.`,
          }
        : {
            title: "dead heat",
            sub: "Everyone struck out, level on the board. Split the round.",
          };
  }
}

export function MultiEndOverlay() {
  const { state, subject, endActions, endNote } = useMultiGame();
  if (state.phase !== "over" || !state.endReason) return null;

  const winnerName =
    state.winnerIndex !== null ? state.players[state.winnerIndex].name : null;
  const { title, sub } = headline(state.endReason, winnerName);
  const order = placings(state);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
      {winnerName !== null && <Confetti />}
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 rounded-xl border bg-card p-8 text-center shadow-2xl shadow-black/40">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {subject.name} · {state.players.length} at the oche
        </p>

        <h2
          className={cn(
            "animate-stamp-in font-display tracking-wide",
            winnerName !== null
              ? "text-6xl text-primary sm:text-7xl"
              : "text-5xl text-treble sm:text-6xl",
          )}
        >
          {title}
        </h2>

        <p className="text-balance text-muted-foreground">{sub}</p>

        <div className="w-full rounded-lg border bg-background/50 px-4 py-3">
          <p className="mb-2 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            final board
          </p>
          <ul className="flex flex-col gap-1.5">
            {order.map((seatIndex, place) => {
              const player = state.players[seatIndex];
              const isWinner = seatIndex === state.winnerIndex;
              return (
                <li
                  key={player.id}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span
                      className={cn(
                        "w-7 shrink-0 text-left font-display",
                        isWinner ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {PLACE_LABELS[place] ?? `${place + 1}th`}
                    </span>
                    <span
                      className={cn(
                        "truncate",
                        isWinner && "font-medium text-primary",
                        player.eliminated &&
                          !isWinner &&
                          "text-muted-foreground line-through decoration-treble/60",
                      )}
                    >
                      {player.name}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-display",
                      player.score === 0
                        ? "text-primary"
                        : "text-foreground/85",
                    )}
                  >
                    {player.score === 0 ? "out" : `${player.score} left`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {endActions.length > 0 && (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            {endActions.map((action) => (
              <Button
                key={action.label}
                onClick={action.onClick}
                size="lg"
                variant={action.variant ?? "default"}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {endNote && (
          <p className="animate-board-flicker text-sm text-muted-foreground">
            {endNote}
          </p>
        )}
      </div>
    </div>
  );
}
