"use client";

import { cn } from "@football/ui/lib/utils";

const DIGIT_RUN = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function DigitColumn({ digit, ghost }: { digit: number; ghost: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-block h-[1em] overflow-hidden transition-opacity duration-300",
        ghost ? "opacity-15" : "opacity-100",
      )}
      aria-hidden
    >
      <span
        className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: `translateY(-${digit}em)` }}
      >
        {DIGIT_RUN.map((n) => (
          <span
            key={n}
            className="flex h-[1em] items-center justify-center leading-none"
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * A three-column scoreboard odometer. Leading zeros stay in place as ghost
 * digits (like unlit segments on a stadium board) so columns never jump.
 */
export function Odometer({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(999, value));
  const digits = String(clamped).padStart(3, "0").split("").map(Number);
  const firstNonZero = digits.findIndex((d) => d !== 0);
  // A checked-out board still lights its final "0".
  const firstLit = firstNonZero === -1 ? digits.length - 1 : firstNonZero;

  return (
    <output
      className={cn("inline-flex font-display tabular-nums", className)}
      aria-label={`${clamped} left`}
    >
      {digits.map((digit, index) => (
        <DigitColumn
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-width digit columns derived from a number each render; position is the identity.
          key={`col-${digits.length - index}`}
          digit={digit}
          ghost={index < firstLit}
        />
      ))}
    </output>
  );
}
