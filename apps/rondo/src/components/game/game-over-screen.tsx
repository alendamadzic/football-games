"use client";

import { Button } from "@football/ui/components/button";
import { Home, RotateCcw, Share2, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { getNationEntry, getPositionEntry } from "@/lib/game/difficulty";
import { generateShareImage } from "@/lib/game/share-image";
import type { GameConfig, GameState } from "@/lib/game/types";
import { ChainTimeline } from "./chain-timeline";
import { useGame } from "./game-provider";

async function shareResult(state: GameState): Promise<void> {
  let blob: Blob;
  try {
    blob = await generateShareImage(state);
  } catch {
    toast.error("Couldn't generate image");
    return;
  }

  const file = new File([blob], "rondo-result.png", { type: "image/png" });

  // Mobile: native share sheet with file
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch {
      // User cancelled — don't fall through to download
      return;
    }
  }

  // Desktop: trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rondo-result.png";
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Image saved!");
}

export function GameOverScreen() {
  const { state, resetToSetup, isOnline, isHost, rematch } = useGame();
  const [sharing, setSharing] = useState(false);
  const isArcade = state.mode === "arcade";
  const winner = state.players.find((p) => p.id === state.winnerId);
  const links = state.chain.length - 1;

  // Headline reflects how the arcade run actually ended.
  const arcadeReason = state.lastElimination?.reason;
  const arcadeHeadline =
    arcadeReason === "timeout"
      ? "Time's up — final score"
      : arcadeReason === "gaveup"
        ? "Run ended — final score"
        : "Wrong link — final score";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Trophy className="size-8" aria-hidden />
        </span>
        {isArcade ? (
          <>
            <p className="font-heading text-sm tracking-widest text-muted-foreground uppercase">
              {arcadeHeadline}
            </p>
            <p className="font-heading text-7xl leading-none text-primary tabular sm:text-8xl">
              {state.score}
            </p>
            <p className="text-muted-foreground">
              {state.score === 1 ? "1 link" : `${state.score} links`} built in
              the chain.
            </p>
          </>
        ) : (
          <>
            <p className="font-heading text-sm tracking-widest text-muted-foreground uppercase">
              Winner
            </p>
            <h2 className="font-heading text-5xl leading-none uppercase sm:text-6xl">
              {winner?.name ?? "Nobody"}
            </h2>
            <p className="text-muted-foreground">
              Last one standing after a {links}-link chain.
            </p>
          </>
        )}
      </div>

      <GameSettings config={state.config} />

      <div className="w-full">
        <p className="mb-3 font-heading text-xs tracking-widest text-muted-foreground uppercase">
          The chain
        </p>
        <ChainTimeline chain={state.chain} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {isOnline ? (
          isHost ? (
            <Button size="lg" onClick={rematch}>
              <RotateCcw aria-hidden />
              Back to lobby
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting for the host to return to the lobby…
            </p>
          )
        ) : (
          <Button size="lg" onClick={resetToSetup}>
            <RotateCcw aria-hidden />
            Play again
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          disabled={sharing}
          onClick={async () => {
            setSharing(true);
            await shareResult(state);
            setSharing(false);
          }}
        >
          <Share2 aria-hidden />
          {sharing ? "Generating…" : "Share result"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <Home aria-hidden />
          Home
        </Button>
      </div>
    </div>
  );
}

function timerLabel(turnSeconds: GameConfig["turnSeconds"]): string {
  if (turnSeconds === "dynamic") return "Dynamic";
  if (turnSeconds === null) return "Off";
  if (turnSeconds < 60) return `${turnSeconds}s`;
  return `${turnSeconds / 60}m`;
}

function GameSettings({ config }: { config: GameConfig }) {
  const { turnSeconds, restrictions } = config;
  const nation = restrictions.nationality
    ? getNationEntry(restrictions.nationality)
    : null;
  const pos = restrictions.position
    ? getPositionEntry(restrictions.position)
    : null;
  const hasRestrictions = nation || pos;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-5 py-3 shadow-sm">
        <span className="font-heading text-2xl font-bold leading-none text-primary">
          {timerLabel(turnSeconds)}
        </span>
        <span className="font-heading text-xs tracking-widest uppercase text-muted-foreground">
          {config.mode === "arcade" ? "Session timer" : "Turn timer"}
        </span>
      </div>
      {nation && (
        <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-5 py-3 shadow-sm">
          <span
            className="text-2xl leading-none"
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
        <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-5 py-3 shadow-sm">
          <span className="font-heading text-2xl font-bold leading-none text-primary">
            {pos.abbr}
          </span>
          <span className="font-heading text-xs tracking-widest uppercase text-muted-foreground">
            {pos.position}s only
          </span>
        </div>
      )}
      {!hasRestrictions && (
        <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-5 py-3 shadow-sm">
          <span className="font-heading text-2xl font-bold leading-none text-primary">
            —
          </span>
          <span className="font-heading text-xs tracking-widest uppercase text-muted-foreground">
            No restrictions
          </span>
        </div>
      )}
    </div>
  );
}
