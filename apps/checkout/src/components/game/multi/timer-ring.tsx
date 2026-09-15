"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

const RADIUS = 15.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/** The shot clock: a brass ring draining down, treble red when it gets tense. */
export function TimerRing({
  deadline,
  totalSeconds,
}: {
  deadline: number;
  totalSeconds: number;
}) {
  const secondsLeft = useCountdown(deadline);
  if (secondsLeft === null) return null;

  const fraction = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const urgent = secondsLeft <= 30;

  return (
    <span
      className="relative flex size-12 shrink-0 items-center justify-center"
      role="timer"
      aria-label={`${formatClock(secondsLeft)} on the clock`}
    >
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
        role="presentation"
      >
        <circle
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          strokeWidth="2.5"
          className="stroke-border"
        />
        <circle
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={cn(
            "transition-[stroke-dashoffset,stroke] duration-1000 ease-linear",
            urgent ? "stroke-treble" : "stroke-primary",
          )}
        />
      </svg>
      <span
        className={cn(
          "font-mono text-[10px] tabular-nums",
          urgent ? "text-treble" : "text-muted-foreground",
          urgent && secondsLeft <= 10 && "animate-board-flicker",
        )}
      >
        {formatClock(secondsLeft)}
      </span>
    </span>
  );
}
