"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { EndOverlay } from "@/components/game/end-overlay";
import { GuessInput } from "@/components/game/guess-input";
import { Odometer } from "@/components/game/odometer";
import { Scoresheet } from "@/components/game/scoresheet";
import { StrikeMeter } from "@/components/game/strike-meter";
import { SubjectPicker } from "@/components/game/subject-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  applyGuess,
  createGame,
  type GameState,
  type GuessEntry,
  MAX_VISIT,
} from "@/lib/game/engine";
import type { Subject } from "@/lib/subjects";
import { subjectCrestUrl } from "@/lib/subjects";
import { resolveGuess } from "@/lib/tm/actions";
import type { PlayerSearchItem } from "@/lib/tm/types";
import { cn } from "@/lib/utils";

interface CallerLine {
  tone: "scored" | "strike" | "warn";
  text: string;
}

function callerLineFor(entry: GuessEntry, subject: Subject): CallerLine {
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

export function Game({ initialScore }: { initialScore: number }) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [limit180, setLimit180] = useState(false);
  const [state, setState] = useState<GameState>(() => createGame(initialScore));
  const [caller, setCaller] = useState<CallerLine | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isChecking, startChecking] = useTransition();

  // Let the board finish rolling (and the final ✗ scrawl in) before the verdict lands.
  useEffect(() => {
    if (state.phase === "playing") {
      setOverlayVisible(false);
      return;
    }
    const timer = setTimeout(
      () => setOverlayVisible(true),
      state.phase === "won" ? 1300 : 800,
    );
    return () => clearTimeout(timer);
  }, [state.phase]);

  const resetRound = () => {
    setState(createGame(initialScore, limit180));
    setCaller(null);
  };

  const handlePick = (picked: Subject) => {
    setSubject(picked);
    resetRound();
  };

  const handleGuess = (item: PlayerSearchItem) => {
    if (!subject || state.phase !== "playing") return;
    startChecking(async () => {
      const result = await resolveGuess(item.playerId, subject.id);
      if (!result.ok) {
        setCaller({
          tone: "warn",
          text: "Couldn't verify that one — no strike, throw again.",
        });
        return;
      }
      const next = applyGuess(state, {
        playerId: item.playerId,
        name: result.name || item.name,
        imageUrl: result.imageUrl,
        apps: result.apps,
      });
      setState(next);
      const entry = next.guesses.at(-1);
      if (entry) setCaller(callerLineFor(entry, subject));
    });
  };

  if (!subject) {
    return (
      <SubjectPicker
        onPick={handlePick}
        limit180={limit180}
        onLimit180Change={setLimit180}
      />
    );
  }

  const lastEntry = state.guesses.at(-1);
  const shakeKey = state.guesses.length;
  const hitMaximum =
    lastEntry?.status === "scored" && lastEntry.player.apps === MAX_VISIT;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <span className="font-display text-2xl tracking-wide">
          checkout<span className="text-primary">.</span>
        </span>
        <span className="flex items-center gap-2.5">
          <Image
            src={subjectCrestUrl(subject)}
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
          />
          <span className="text-sm font-medium">{subject.name}</span>
          {state.limit180 && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              {MAX_VISIT} max
            </Badge>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSubject(null)}
            className="text-muted-foreground"
          >
            change board
          </Button>
        </span>
      </header>

      <main className="grid flex-1 content-start items-start gap-8 lg:grid-cols-2">
        <section className="flex flex-col items-center gap-5 lg:sticky lg:top-8">
          <div
            key={shakeKey}
            className={cn(
              "flex flex-col items-center",
              lastEntry?.status === "bust" && "animate-bust-shake",
            )}
          >
            <Odometer
              value={state.score}
              className={cn(
                "text-[6.5rem] leading-none sm:text-[9rem] transition-opacity duration-300",
                isChecking && "opacity-60",
              )}
            />
            <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              required
            </span>
          </div>

          <StrikeMeter strikes={state.strikes} />

          <div className="flex w-full max-w-md flex-col gap-2">
            <GuessInput
              subjectName={subject.shortName}
              usedPlayerIds={state.guesses.map(
                (guess) => guess.player.playerId,
              )}
              disabled={isChecking || state.phase !== "playing"}
              onGuess={handleGuess}
            />
            <p
              aria-live="polite"
              className={cn(
                "min-h-10 text-balance px-1 text-center text-sm",
                isChecking && "animate-board-flicker text-muted-foreground",
                !isChecking && caller?.tone === "scored" && "text-bed-green",
                !isChecking && caller?.tone === "strike" && "text-treble",
                !isChecking && caller?.tone === "warn" && "text-primary",
                !isChecking && !caller && "text-muted-foreground",
              )}
            >
              {isChecking
                ? "VAR check…"
                : (caller?.text ??
                  "Every appearance for the badge counts down. Find the route to zero.")}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <Scoresheet entries={state.guesses} />
        </section>
      </main>

      {hitMaximum && (
        <div
          key={`max-${shakeKey}`}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
        >
          <div className="animate-one-eighty flex flex-col items-center gap-1">
            <span className="font-display text-[7rem] leading-none tracking-wide text-primary drop-shadow-[0_0_40px_oklch(0.79_0.115_85/0.55)] sm:text-[11rem]">
              180
            </span>
            <span className="font-marker text-xl text-primary sm:text-2xl">
              one hundred and eightyyy!
            </span>
          </div>
        </div>
      )}

      {state.phase !== "playing" && overlayVisible && (
        <EndOverlay
          state={state}
          subject={subject}
          startScore={initialScore}
          onPlayAgain={resetRound}
          onNewBoard={() => setSubject(null)}
        />
      )}
    </div>
  );
}
