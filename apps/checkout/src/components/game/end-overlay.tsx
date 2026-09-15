"use client";

import { Button } from "@football/ui/components/button";
import { cn } from "@football/ui/lib/utils";
import type { GameState } from "@/lib/game/engine";
import type { Subject } from "@/lib/subjects";

const CONFETTI_COLORS = [
  "bg-primary",
  "bg-bed-green",
  "bg-foreground",
  "bg-treble",
];

export function Confetti() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: 36 }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: decorative static pieces, never reordered
          key={i}
          className={cn(
            "animate-confetti-fall absolute top-0 block h-3 w-1.5 rounded-[1px]",
            CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          )}
          style={{
            left: `${(i * 137) % 100}%`,
            animationDelay: `${((i * 53) % 140) / 100}s`,
            animationDuration: `${2 + ((i * 31) % 120) / 100}s`,
          }}
        />
      ))}
    </div>
  );
}

interface EndOverlayProps {
  state: GameState;
  subject: Subject;
  startScore: number;
  onPlayAgain: () => void;
  onNewBoard: () => void;
}

export function EndOverlay({
  state,
  subject,
  startScore,
  onPlayAgain,
  onNewBoard,
}: EndOverlayProps) {
  const won = state.phase === "won";
  const scoredVisits = state.guesses.filter(
    (guess) => guess.status === "scored",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
      {won && <Confetti />}
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 rounded-xl border bg-card p-8 text-center shadow-2xl shadow-black/40">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {subject.name} · {startScore} down
        </p>

        {won ? (
          <h2 className="animate-stamp-in font-display text-6xl tracking-wide text-primary sm:text-7xl">
            checkout!
          </h2>
        ) : (
          <h2 className="animate-stamp-in font-display text-5xl tracking-wide text-treble sm:text-6xl">
            no darts left
          </h2>
        )}

        <p className="text-balance text-muted-foreground">
          {won
            ? `${startScore} cleared in ${scoredVisits.length} ${scoredVisits.length === 1 ? "visit" : "visits"}. Game shot.`
            : `Three strikes on the board. You left ${state.score}.`}
        </p>

        {scoredVisits.length > 0 && (
          <div className="w-full rounded-lg border bg-background/50 px-4 py-3">
            <p className="mb-2 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {won ? "the route" : "what you chalked"}
            </p>
            <ul className="flex flex-col gap-1.5">
              {scoredVisits.map((visit) => (
                <li
                  key={visit.player.playerId}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="truncate">{visit.player.name}</span>
                  <span className="font-display text-bed-green">
                    −{visit.player.apps}
                  </span>
                </li>
              ))}
              {!won && (
                <li className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-1.5 text-sm text-muted-foreground">
                  <span>left on the board</span>
                  <span className="font-display">{state.score}</span>
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={onPlayAgain} size="lg">
            {won ? "Go again" : "Rechalk it"}
          </Button>
          <Button onClick={onNewBoard} size="lg" variant="outline">
            Pick another board
          </Button>
        </div>
      </div>
    </div>
  );
}
