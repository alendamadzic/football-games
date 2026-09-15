import type { Match, Player } from "@/lib/types";

// Each team set gets its own ink colour, the way a real album themes its pages.
export const HOME_INK = "oklch(0.31 0.092 256)"; // deep navy
export const AWAY_INK = "oklch(0.37 0.13 28)"; // burgundy

// Slight per-sticker tilt as it's pressed into the page.
export const ROT = ["-5deg", "4deg", "-3deg", "6deg", "-6deg", "3deg", "-4deg"];

export const FOIL =
  "bg-[linear-gradient(115deg,transparent,oklch(0.88_0.11_90/.6),oklch(0.9_0.06_200/.45),transparent)]";

export type Side = "home" | "away";

export interface ResolvedPlayer {
  key: string;
  side: Side;
  index: number;
  catalog: number;
  player: Player;
  teamName: string;
  ink: string;
}

// Turn a game-state key ("home-3") back into everything the UI needs to render
// that player — used by the reveal card and the auto-scroll.
export function resolvePlayer(
  match: Match,
  key: string,
): ResolvedPlayer | null {
  const [side, raw] = key.split("-");
  if (side !== "home" && side !== "away") return null;
  const index = Number(raw);
  const players = side === "home" ? match.homePlayers : match.awayPlayers;
  const player = players[index];
  if (!player) return null;
  return {
    key,
    side,
    index,
    catalog: (side === "home" ? 1 : 12) + index,
    player,
    teamName: side === "home" ? match.homeTeam : match.awayTeam,
    ink: side === "home" ? HOME_INK : AWAY_INK,
  };
}

function cssPx(name: string): number {
  if (typeof window === "undefined") return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  return Number.parseFloat(raw) || 0;
}

/**
 * Scroll a sticker into the band of screen the player can actually see —
 * below the sticky HUD, above the guess dock and above the keyboard — but only
 * if it isn't already there. Skipping the no-op scroll is what stops the page
 * lurching under the player's thumb after every correct guess.
 */
export function scrollStickerIntoBand(
  el: HTMLElement,
  { reducedMotion = false }: { reducedMotion?: boolean } = {},
) {
  const hud = document
    .querySelector("[data-xi-hud]")
    ?.getBoundingClientRect().height;
  const top = (hud ?? 0) + 12;
  const bottom =
    window.innerHeight - cssPx("--xi-dock-h") - cssPx("--xi-kb") - 12;
  if (bottom - top < 40) return; // no usable band — don't fight the keyboard

  const rect = el.getBoundingClientRect();
  if (rect.top >= top && rect.bottom <= bottom) return; // already in view

  const centred = top + (bottom - top) / 2 - rect.height / 2;
  window.scrollTo({
    top: window.scrollY + rect.top - centred,
    behavior: reducedMotion ? "auto" : "smooth",
  });
}
