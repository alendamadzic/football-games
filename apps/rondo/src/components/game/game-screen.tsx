"use client";

import { Flag } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/use-countdown";
import {
  activePlayer,
  referenceClub,
  referencePlayer,
} from "@/lib/game/reducer";
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
  const seed = state.chain[0];
  const resetKey = isArcade
    ? `arcade-${seed?.id ?? "idle"}`
    : `${state.chain.length}-${state.activePlayerIndex}`;

  const remaining = useCountdown({
    seconds: state.config.turnSeconds,
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
        {state.config.turnSeconds != null && remaining != null && (
          <TimerBar
            remaining={remaining}
            total={state.config.turnSeconds}
            label={isArcade ? "Session" : "Turn"}
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
