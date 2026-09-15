"use client";

import { Badge } from "@football/ui/components/badge";
import { cn } from "@football/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { GuessInput } from "@/components/game/guess-input";
import { useMultiGame } from "@/components/game/multi/game-context";
import { MultiEndOverlay } from "@/components/game/multi/multi-end-overlay";
import { PlayerStrip } from "@/components/game/multi/player-strip";
import { TurnBanner } from "@/components/game/multi/turn-banner";
import { Odometer } from "@/components/game/odometer";
import { Scoresheet, type ScoresheetRow } from "@/components/game/scoresheet";
import { StrikeMeter } from "@/components/game/strike-meter";
import { type CallerLine, multiCallerLineFor } from "@/lib/game/caller";
import { MAX_VISIT } from "@/lib/game/engine";
import { subjectCrestUrl } from "@/lib/subjects";
import { resolveGuess } from "@/lib/tm/actions";
import type { PlayerSearchItem } from "@/lib/tm/types";

/** The shared multiplayer board — local and online providers both drive it. */
export function MultiGameBoard() {
  const { state, subject, isMyTurn, mySeatIndex, roomCode, submitGuess } =
    useMultiGame();
  const [caller, setCaller] = useState<CallerLine | null>(null);
  const [pendingGuess, setPendingGuess] = useState<PlayerSearchItem | null>(
    null,
  );
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isChecking, startChecking] = useTransition();

  const activePlayer = state.players[state.activeIndex];

  // Call every turn as it lands — including turns thrown on other devices.
  useEffect(() => {
    const entry = state.guesses.at(-1);
    if (!entry) {
      setCaller(null);
      return;
    }
    setCaller(
      multiCallerLineFor(entry, state.players[entry.seatIndex].name, subject),
    );
  }, [state.guesses, state.players, subject]);

  // Let the board finish rolling before the verdict lands (same beat as solo).
  useEffect(() => {
    if (state.phase !== "over") {
      setOverlayVisible(false);
      return;
    }
    const timer = setTimeout(
      () => setOverlayVisible(true),
      state.endReason === "checkout" ? 1300 : 800,
    );
    return () => clearTimeout(timer);
  }, [state.phase, state.endReason]);

  const handleGuess = (item: PlayerSearchItem) => {
    if (state.phase !== "playing" || !isMyTurn) return;
    setPendingGuess(item);
    startChecking(async () => {
      try {
        const result = await resolveGuess(item.playerId, subject.id);
        if (!result.ok) {
          setCaller({
            tone: "warn",
            text: "Couldn't verify that one — no strike, throw again.",
          });
          return;
        }
        await submitGuess({
          playerId: item.playerId,
          name: result.name || item.name,
          imageUrl: result.imageUrl,
          apps: result.apps,
        });
      } catch {
        // Most likely the shot clock forfeited the turn mid-lookup.
        setCaller({
          tone: "warn",
          text: "That dart didn't land — the clock may have beaten you.",
        });
      } finally {
        setPendingGuess(null);
      }
    });
  };

  const rows: ScoresheetRow[] = state.guesses.map((entry) => ({
    player: entry.player,
    status: entry.status,
    scoreAfter: entry.scoreAfter,
    byName: state.players[entry.seatIndex].name,
  }));

  const lastEntry = state.guesses.at(-1);
  const shakeKey = state.guesses.length;
  const hitMaximum =
    lastEntry?.status === "scored" && lastEntry.player?.apps === MAX_VISIT;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="font-display text-2xl tracking-wide">
          checkout<span className="text-primary">.</span>
        </Link>
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
          {roomCode && (
            <Badge variant="outline" className="font-mono tracking-[0.2em]">
              {roomCode}
            </Badge>
          )}
        </span>
      </header>

      <PlayerStrip
        players={state.players}
        activeIndex={state.activeIndex}
        winnerIndex={state.winnerIndex}
        mySeatIndex={roomCode ? mySeatIndex : null}
      />

      <main className="grid flex-1 content-start items-start gap-8 lg:grid-cols-2">
        <section className="flex flex-col items-center gap-5 lg:sticky lg:top-8">
          <div
            key={shakeKey}
            className={cn(
              "flex flex-col items-center",
              (lastEntry?.status === "bust" || lastEntry?.status === "over") &&
                "animate-bust-shake",
            )}
          >
            <Odometer
              value={activePlayer.score}
              className={cn(
                "text-[6.5rem] leading-none sm:text-[9rem] transition-opacity duration-300",
                isChecking && "opacity-60",
              )}
            />
            <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {activePlayer.name} requires
            </span>
          </div>

          <StrikeMeter strikes={activePlayer.strikes} />

          <div className="flex w-full max-w-md flex-col gap-2">
            <TurnBanner />
            <GuessInput
              subjectName={subject.shortName}
              usedPlayerIds={state.usedPlayerIds}
              disabled={isChecking || !isMyTurn || state.phase !== "playing"}
              onGuess={handleGuess}
            />
            <p
              aria-live="polite"
              className={cn(
                "min-h-10 text-balance px-1 text-center text-sm",
                isChecking && "text-muted-foreground/50",
                !isChecking && caller?.tone === "scored" && "text-bed-green",
                !isChecking && caller?.tone === "strike" && "text-treble",
                !isChecking && caller?.tone === "warn" && "text-primary",
                !isChecking && !caller && "text-muted-foreground",
              )}
            >
              {caller?.text ??
                "Same board, shared names. Every dart thrown burns a name for the whole table."}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <Scoresheet
            entries={rows}
            pending={isChecking ? pendingGuess : null}
            pendingByName={isChecking ? activePlayer.name : undefined}
          />
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

      {state.phase === "over" && overlayVisible && <MultiEndOverlay />}
    </div>
  );
}
