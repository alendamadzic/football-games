"use client";

import { cn } from "@football/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { GameApi } from "@/hooks/useGameState";
import { formationLabel } from "@/lib/formation";
import type { Match } from "@/lib/types";
import { Sticker } from "./Sticker";
import type { Side } from "./shared";

export function TeamPage({
  side,
  ink,
  match,
  game,
  over,
  photos,
  open,
  collapsible,
  onToggle,
  registerSticker,
}: {
  side: Side;
  ink: string;
  match: Match;
  game: GameApi;
  over: boolean;
  photos: Record<string, string>;
  open: boolean;
  collapsible: boolean;
  onToggle: () => void;
  registerSticker: (key: string, el: HTMLDivElement | null) => void;
}) {
  const players = side === "home" ? match.homePlayers : match.awayPlayers;
  const teamName = side === "home" ? match.homeTeam : match.awayTeam;
  const found = players.filter((_, i) => game.isGuessed(side, i)).length;
  const base = side === "home" ? 1 : 12;
  const panelId = useId();

  // The collapse animates via grid-template-rows, which needs the panel
  // clipped. Once it's open we drop the clipping again so a sticker's "slap"
  // scale-up isn't cut off at the edges of the grid.
  const [clip, setClip] = useState(!open);
  useEffect(() => {
    if (!open) setClip(true);
    else if (!collapsible) setClip(false);
  }, [open, collapsible]);

  const header = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        {collapsible && (
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden
          />
        )}
        <span className="truncate font-display text-xl uppercase italic tracking-wide sm:text-2xl">
          {teamName}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {/* A collapsed section still has to read at a glance. */}
        <span
          className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-white/20 sm:block"
          aria-hidden
        >
          <span
            className="block h-full rounded-full bg-white/80 transition-[width] duration-500"
            style={{ width: `${(found / players.length) * 100}%` }}
          />
        </span>
        <span className="rounded bg-white/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider tabular-nums">
          {formationLabel(players)} · {found}/{players.length}
        </span>
      </span>
    </>
  );

  const headerClasses =
    "flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-white shadow-[2px_2px_0_rgba(0,0,0,0.25)]";

  return (
    <section>
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(headerClasses, "transition-opacity active:opacity-90")}
          style={{ backgroundColor: ink }}
        >
          {header}
        </button>
      ) : (
        <div className={headerClasses} style={{ backgroundColor: ink }}>
          {header}
        </div>
      )}

      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        onTransitionEnd={() => {
          if (open) setClip(false);
        }}
      >
        <div className={cn("min-h-0", clip && "overflow-hidden")}>
          <p className="mb-2 mt-1 px-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[oklch(0.45_0.04_60)]">
            Stickers Nº {base}–{base + players.length - 1}
          </p>
          <div
            className="grid grid-cols-3 gap-1.5 sm:gap-2.5"
            aria-hidden={!open}
          >
            {players.map((player, i) => (
              <Sticker
                key={player.number}
                player={player}
                ink={ink}
                catalog={base + i}
                index={i}
                collected={game.isGuessed(side, i)}
                over={over}
                photoUrl={photos[player.name]}
                registerRef={(el) => registerSticker(`${side}-${i}`, el)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
