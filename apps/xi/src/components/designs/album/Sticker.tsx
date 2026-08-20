"use client";

import { Star } from "lucide-react";
import { nationalityFlag } from "@/lib/nationality";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FOIL, ROT } from "./shared";

/**
 * Type inside a sticker is sized in container-query units so it stays in
 * proportion whether the cell is ~105px on a phone or ~155px in a desktop
 * album column. The clamp floors keep it legible at the small end and stop it
 * ballooning at the large end.
 */
const TYPE = {
  brand: "text-[clamp(0.42rem,3.4cqw,0.55rem)]",
  strip: "h-[clamp(0.8rem,6cqw,1.15rem)]",
  pip: "size-[clamp(1.1rem,13cqw,1.6rem)] text-[clamp(0.52rem,5cqw,0.72rem)]",
  name: "text-[clamp(0.7rem,9.5cqw,1rem)]",
  position: "text-[clamp(0.5625rem,5cqw,0.72rem)]",
  flag: "text-[clamp(1.9rem,26cqw,3rem)]",
  catalog: "text-[clamp(0.5rem,4.6cqw,0.68rem)]",
  bigNumber: "text-[clamp(2.1rem,30cqw,4rem)]",
  footer: "text-[clamp(0.44rem,4cqw,0.6rem)]",
} as const;

export function Sticker({
  player,
  ink,
  catalog,
  index,
  collected,
  over,
  photoUrl,
  registerRef,
}: {
  player: Player;
  ink: string;
  catalog: number;
  index: number;
  collected: boolean;
  over: boolean;
  photoUrl?: string;
  registerRef?: (el: HTMLDivElement | null) => void;
}) {
  const missing = over && !collected;

  if (collected) {
    return (
      <div
        ref={registerRef}
        style={{
          borderColor: ink,
          ["--slap-rot" as string]: ROT[index % ROT.length],
        }}
        className="animate-slap @container relative flex aspect-[3/4] flex-col overflow-hidden rounded-md border-[3px] bg-white shadow-[2px_3px_0_rgba(0,0,0,0.18)]"
      >
        {/* brand strip */}
        <div
          className={cn("flex items-center justify-center", TYPE.strip)}
          style={{ backgroundColor: ink }}
        >
          <span
            className={cn(
              "font-black uppercase tracking-[0.3em] text-white/85",
              TYPE.brand,
            )}
          >
            xi · {catalog}
          </span>
        </div>
        {/* portrait */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden"
          style={{
            background: `linear-gradient(160deg, color-mix(in oklab, ${ink} 22%, white), white)`,
          }}
        >
          <div
            className="halftone absolute inset-0 opacity-[0.14]"
            style={{ color: ink }}
          />
          <span
            className={cn(
              "absolute left-1 top-1 z-10 grid place-items-center rounded-full font-black text-white shadow",
              TYPE.pip,
            )}
            style={{ backgroundColor: ink }}
          >
            {player.number}
          </span>
          {player.position === "GK" && (
            <Star className="absolute right-1 top-1 z-10 size-3.5 fill-amber-300 text-amber-500 drop-shadow" />
          )}
          {photoUrl ? (
            // biome-ignore lint/performance/noImgElement: Transfermarkt headshots are remote and next/image would need remotePatterns config
            <img
              src={photoUrl}
              alt={player.name}
              className="absolute inset-0 h-full w-full object-contain object-center"
            />
          ) : (
            <span
              className={cn(
                "select-none leading-none drop-shadow-sm",
                TYPE.flag,
              )}
            >
              {nationalityFlag(player.nationality)}
            </span>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-transparent" />
        </div>
        {/* name banner — two lines, so long surnames aren't cut to stubs */}
        <div className="px-1 py-1 text-center" style={{ backgroundColor: ink }}>
          <p
            className={cn(
              "line-clamp-2 font-extrabold uppercase leading-[1.05] text-white",
              TYPE.name,
            )}
          >
            {player.name}
          </p>
          <p
            className={cn(
              "font-semibold uppercase tracking-wider text-white/70",
              TYPE.position,
            )}
          >
            {player.position}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={registerRef}
      className={cn(
        "@container relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed shadow-inner",
        missing
          ? "border-destructive/50 bg-destructive/[0.06]"
          : "border-[oklch(0.24_0.028_60/.3)] bg-[oklch(0.9_0.035_85)]",
      )}
    >
      <span
        className={cn(
          "absolute left-1.5 top-1 font-bold",
          TYPE.catalog,
          missing ? "text-destructive/70" : "text-[oklch(0.4_0.03_60/.65)]",
        )}
      >
        Nº {catalog}
      </span>

      {!missing && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={cn(
              "animate-shine absolute inset-y-0 -left-1/2 w-2/3",
              FOIL,
            )}
            style={{ animationDelay: `${(index % 5) * 0.5}s` }}
          />
        </div>
      )}

      <span
        className={cn(
          "font-display leading-none",
          TYPE.bigNumber,
          missing ? "text-destructive/20" : "text-[oklch(0.24_0.028_60/.13)]",
        )}
      >
        {player.number}
      </span>

      {missing ? (
        <p
          className={cn(
            "mt-1 line-clamp-2 max-w-full px-1 text-center font-bold uppercase leading-tight text-destructive/90",
            TYPE.footer,
          )}
        >
          {player.name}
        </p>
      ) : (
        <span
          className={cn(
            "mt-1 font-bold uppercase tracking-widest text-[oklch(0.24_0.028_60/.3)]",
            TYPE.footer,
          )}
        >
          {player.position}
        </span>
      )}

      <span
        className={cn(
          "absolute inset-x-0 bottom-1 text-center font-black uppercase tracking-[0.2em]",
          TYPE.footer,
          missing ? "text-destructive/70" : "text-[oklch(0.24_0.028_60/.3)]",
        )}
      >
        {missing ? "Missing!" : "Needed"}
      </span>
    </div>
  );
}
