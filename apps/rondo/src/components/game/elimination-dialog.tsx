"use client";

import { HeartCrack, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EliminationInfo } from "@/lib/game/types";
import { useGame } from "./game-provider";

const REASON_TEXT: Record<EliminationInfo["reason"], string> = {
  wrong: "named a link the database couldn't back up.",
  timeout: "ran out of time.",
  gaveup: "passed on the turn.",
};

export function EliminationDialog() {
  const { state, dispatch } = useGame();
  const open = state.phase === "elimination";
  const info = state.lastElimination;
  if (!info) return null;

  const lastResult = state.players.filter((p) => !p.eliminated).length <= 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              {info.eliminated ? (
                <Skull className="size-5" aria-hidden />
              ) : (
                <HeartCrack className="size-5" aria-hidden />
              )}
            </span>
            <DialogTitle className="font-heading text-2xl uppercase">
              {info.eliminated
                ? `${info.playerName} is out`
                : `${info.playerName} lost a life`}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-1 text-base">
            {info.playerName} {REASON_TEXT[info.reason]}
            {!info.eliminated && (
              <>
                {" "}
                <span className="font-semibold text-foreground">
                  {info.livesLeft} {info.livesLeft === 1 ? "life" : "lives"}{" "}
                  left.
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {info.attempted && info.reason === "wrong" && (
          <p className="text-sm text-muted-foreground">
            Answered:{" "}
            <span className="font-medium text-foreground">
              {info.attempted}
            </span>
          </p>
        )}

        {info.knownClubs && info.knownClubs.length > 0 && (
          <div>
            <p className="mb-2 font-heading text-xs tracking-widest text-muted-foreground uppercase">
              That player actually played for
            </p>
            <div className="flex flex-wrap gap-1.5">
              {info.knownClubs.slice(0, 8).map((club) => (
                <span
                  key={club.id}
                  className="rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium"
                >
                  {club.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => dispatch({ type: "CONTINUE" })} size="lg">
            {lastResult ? "See result" : "Next player"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
