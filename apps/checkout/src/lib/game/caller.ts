import {
  type GuessEntry,
  MAX_VISIT,
  type MultiGuessEntry,
} from "@/lib/game/engine";
import type { Subject } from "@/lib/subjects";

export interface CallerLine {
  tone: "scored" | "strike" | "warn";
  text: string;
}

export function callerLineFor(entry: GuessEntry, subject: Subject): CallerLine {
  const { player } = entry;
  switch (entry.status) {
    case "scored":
      if (player.apps === MAX_VISIT) {
        return {
          tone: "scored",
          text:
            entry.scoreAfter === 0
              ? `${player.name} — one hundred and eighty, and checkout!`
              : `${player.name} — one hundred and eighty! ${entry.scoreAfter} left.`,
        };
      }
      return {
        tone: "scored",
        text:
          entry.scoreAfter === 0
            ? `${player.name} for ${player.apps}. Checkout!`
            : `${player.name}, ${player.apps} appearances. ${entry.scoreAfter} left.`,
      };
    case "over":
      return {
        tone: "strike",
        text: `${player.name} has ${player.apps} for ${subject.shortName} — over the ${MAX_VISIT} ceiling. Burned.`,
      };
    case "bust":
      return {
        tone: "strike",
        text: `${player.name} has ${player.apps} for ${subject.shortName} — past zero. Burned.`,
      };
    case "invalid":
      return {
        tone: "strike",
        text: `${player.name} never made an appearance for ${subject.shortName}.`,
      };
    case "duplicate":
      return {
        tone: "strike",
        text: `${player.name} is already on the sheet.`,
      };
  }
}

/** Multiplayer caller: same patter, but the thrower gets named on the call. */
export function multiCallerLineFor(
  entry: MultiGuessEntry,
  throwerName: string,
  subject: Subject,
): CallerLine {
  if (entry.status === "timeout" || entry.player === null) {
    return {
      tone: "strike",
      text: `${throwerName} — the clock's gone. That's a dart wasted.`,
    };
  }
  const { player } = entry;
  switch (entry.status) {
    case "scored":
      if (player.apps === MAX_VISIT) {
        return {
          tone: "scored",
          text:
            entry.scoreAfter === 0
              ? `${throwerName} — one hundred and eighty, and checkout!`
              : `${throwerName} — one hundred and eighty! ${entry.scoreAfter} left.`,
        };
      }
      return {
        tone: "scored",
        text:
          entry.scoreAfter === 0
            ? `${player.name} for ${player.apps} — ${throwerName} checks out!`
            : `${player.name}, ${player.apps} appearances. ${throwerName} requires ${entry.scoreAfter}.`,
      };
    case "over":
      return {
        tone: "strike",
        text: `${player.name} has ${player.apps} for ${subject.shortName} — over the ${MAX_VISIT} ceiling. ${throwerName} is burned.`,
      };
    case "bust":
      return {
        tone: "strike",
        text: `${player.name} has ${player.apps} for ${subject.shortName} — ${throwerName} goes past zero. Burned.`,
      };
    case "invalid":
      return {
        tone: "strike",
        text: `${player.name} never made an appearance for ${subject.shortName}. Strike for ${throwerName}.`,
      };
    case "duplicate":
      return {
        tone: "strike",
        text: `${player.name} is already on the sheet. ${throwerName} should've been listening.`,
      };
  }
}
