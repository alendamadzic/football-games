"use client";

import { cn } from "@football/ui/lib/utils";
import { useEffect, useState } from "react";
import type { GuessEvent } from "@/hooks/useGameState";
import { nationalityFlag } from "@/lib/nationality";
import type { Match } from "@/lib/types";
import { resolvePlayer } from "./shared";

const DWELL_MS = 1800;

/**
 * The answer to "did that work?" on a phone. The collected sticker is usually
 * off-screen behind the keyboard, so a miniature of it surfaces right above the
 * input for a moment — where the player is already looking.
 */
export function CollectedFlash({
  match,
  event,
  score,
  total,
  photos,
}: {
  match: Match;
  event: GuessEvent | null;
  score: number;
  total: number;
  photos: Record<string, string>;
}) {
  const [shown, setShown] = useState<GuessEvent | null>(null);

  useEffect(() => {
    if (!event || event.kind === "wrong") {
      setShown(null);
      return;
    }
    setShown(event);
    const id = setTimeout(() => setShown(null), DWELL_MS);
    return () => clearTimeout(id);
  }, [event]);

  if (!shown) return null;

  const players = shown.keys
    .map((k) => resolvePlayer(match, k))
    .filter((p) => p !== null);
  if (players.length === 0) return null;

  const duplicate = shown.kind === "duplicate";

  return (
    <div
      key={shown.nonce}
      className="animate-rise pointer-events-none absolute bottom-full left-0 right-0 mb-2 flex justify-center"
      aria-hidden
    >
      <div
        className={cn(
          "flex max-w-full items-center gap-2.5 rounded-lg border-2 py-1.5 pl-1.5 pr-3 shadow-[2px_2px_0_oklch(0.24_0.028_60)]",
          duplicate
            ? "border-amber-600 bg-amber-50"
            : "border-[oklch(0.24_0.028_60)] bg-[oklch(0.955_0.02_88)]",
        )}
      >
        <div className="flex shrink-0 -space-x-3">
          {players.map((p) => (
            <div
              key={p.key}
              className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded border-2 bg-white"
              style={{ borderColor: p.ink }}
            >
              {photos[p.player.name] ? (
                // biome-ignore lint/performance/noImgElement: Transfermarkt headshots are remote and next/image would need remotePatterns config
                <img
                  src={photos[p.player.name]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <span className="text-2xl leading-none">
                  {nationalityFlag(p.player.nationality)}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <p
            className={cn(
              "text-[0.6rem] font-black uppercase tracking-[0.15em]",
              duplicate ? "text-amber-700" : "text-primary",
            )}
          >
            {duplicate ? "Already collected" : "Stuck it in!"}
          </p>
          <p className="truncate text-sm font-extrabold uppercase leading-tight text-[oklch(0.24_0.028_60)]">
            {players.map((p) => p.player.name).join(" & ")}
          </p>
          <p className="truncate text-[0.65rem] font-semibold uppercase text-[oklch(0.45_0.04_60)]">
            {players.length === 1
              ? `Nº ${players[0].catalog} · ${players[0].teamName}`
              : `${players.length} stickers`}{" "}
            · {score}/{total}
          </p>
        </div>
      </div>
    </div>
  );
}
