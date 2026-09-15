"use client";

import { MAX_STRIKES } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

function DartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {/* flight */}
      <path
        d="M2.5 6.5 6.5 7.5 7.5 6.5 6.5 2.5 4 4 2.5 6.5z"
        fill="currentColor"
        stroke="none"
      />
      {/* shaft */}
      <path d="M7 7l4 4" strokeWidth="1.4" />
      {/* barrel */}
      <path d="M11.8 11.8 15.8 15.8" strokeWidth="3.2" />
      {/* point */}
      <path d="M16.8 16.8 21.5 21.5" strokeWidth="1.6" />
    </svg>
  );
}

export function StrikeMeter({ strikes }: { strikes: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {Array.from({ length: MAX_STRIKES }, (_, slot) => {
          const spent = slot < strikes;
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed set of dart slots, never reordered
              key={slot}
              className="relative flex size-6 items-center justify-center"
            >
              <DartIcon
                className={cn(
                  "size-5 transition-all duration-300",
                  spent ? "text-muted-foreground/30" : "text-foreground/80",
                )}
              />
              {spent && (
                <span className="animate-scrawl-in absolute inset-0 flex items-center justify-center font-marker text-xl leading-none text-treble">
                  ✗
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {MAX_STRIKES - strikes === 1
          ? "last dart"
          : `${MAX_STRIKES - strikes} darts in hand`}
      </span>
    </div>
  );
}
