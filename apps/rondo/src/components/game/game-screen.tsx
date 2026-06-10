"use client";

import { Flag } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/use-countdown";
import {
  getDynamicSeconds,
  getNationEntry,
  getPositionEntry,
} from "@/lib/game/difficulty";
import {
  activePlayer,
  referenceClub,
  referencePlayer,
} from "@/lib/game/reducer";
import type { RestrictedPosition } from "@/lib/game/types";
import { AnswerInput } from "./answer-input";
import { ChainTimeline } from "./chain-timeline";
import { EliminationDialog } from "./elimination-dialog";
import { GameOverScreen } from "./game-over-screen";
import { useGame } from "./game-provider";
import { PlayerRoster } from "./player-roster";
import { ScoreBoard } from "./score-board";
import { SetupForm } from "./setup-form";
import { TimerBar } from "./timer-bar";
import { TurnBanner } from "./turn-banner";

export function GameScreen() {
  const { state, dispatch } = useGame();
  const isArcade = state.mode === "arcade";

  const handleTimeout = useCallback(() => {
    dispatch({ type: "FAIL", reason: "timeout", attempted: null });
  }, [dispatch]);

  // Local: a fresh per-turn clock. Arcade: one clock for the whole session,
  // keyed to the seed so it restarts only on a new game.
  // Dynamic timer always uses a per-turn key regardless of mode.
  const seed = state.chain[0];
  const isDynamic = state.config.turnSeconds === "dynamic";
  const resetKey =
    isDynamic || !isArcade
      ? `${state.chain.length}-${state.activePlayerIndex}`
      : `arcade-${seed?.id ?? "idle"}`;

  const effectiveSeconds: number | null = isDynamic
    ? getDynamicSeconds(state.chain.length)
    : typeof state.config.turnSeconds === "number"
      ? state.config.turnSeconds
      : null;

  const remaining = useCountdown({
    seconds: effectiveSeconds,
    running: state.phase === "playing",
    resetKey,
    onExpire: handleTimeout,
  });

  if (state.phase === "setup") return <SetupForm />;
  if (state.phase === "gameover") return <GameOverScreen />;

  const refClub = referenceClub(state);
  const refPlayer = referencePlayer(state);
  const active = activePlayer(state);
  const referenceName =
    state.turnKind === "player"
      ? (refClub?.name ?? "")
      : (refPlayer?.name ?? "");

  return (
    <div className="pitch-backdrop mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      {/* Status row */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        {isArcade ? (
          <ScoreBoard score={state.score} />
        ) : (
          <PlayerRoster
            players={state.players}
            activeIndex={state.activePlayerIndex}
            showLives={state.config.lives > 1}
          />
        )}
        {effectiveSeconds != null && remaining != null && (
          <TimerBar
            remaining={remaining}
            total={effectiveSeconds}
            label={isDynamic ? "Dynamic Turn" : isArcade ? "Session" : "Turn"}
          />
        )}
      </div>

      {/* The chain */}
      <ChainTimeline chain={state.chain} />

      {/* Turn + answer */}
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 pt-2">
        <TurnBanner
          turnKind={state.turnKind}
          referenceName={referenceName}
          activePlayerName={isArcade ? undefined : active?.name}
        />
        <RestrictionBadges
          nationality={state.config.restrictions.nationality}
          position={state.config.restrictions.position}
          turnKind={state.turnKind}
        />
        <AnswerInput key={`${state.chain.length}-${state.activePlayerIndex}`} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            dispatch({ type: "FAIL", reason: "gaveup", attempted: null })
          }
          className="text-muted-foreground"
        >
          <Flag aria-hidden />
          {isArcade ? "End run" : "Give up turn"}
        </Button>
      </div>

      <EliminationDialog />
    </div>
  );
}

function RestrictionBadges({
  nationality,
  position,
  turnKind,
}: {
  nationality: string | null;
  position: RestrictedPosition | null;
  turnKind: "player" | "club";
}) {
  if (turnKind !== "player" || (!nationality && !position)) return null;

  const nation = nationality ? getNationEntry(nationality) : null;
  const pos = position ? getPositionEntry(position) : null;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {nation && (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border bg-card px-5 py-3 shadow-sm">
          <span
            className="text-4xl leading-none"
            role="img"
            aria-label={nation.nationality}
          >
            {nation.flag}
          </span>
          <span className="font-heading text-xs tracking-widest uppercase text-muted-foreground">
            {nation.nationality} only
          </span>
        </div>
      )}
      {pos && (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border bg-card px-5 py-3 shadow-sm">
          <span className="font-heading text-4xl font-bold leading-none tabular-nums text-primary">
            {pos.abbr}
          </span>
          <span className="font-heading text-xs tracking-widest uppercase text-muted-foreground">
            {pos.position}s only
          </span>
        </div>
      )}
    </div>
  );
}
