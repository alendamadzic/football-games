"use client";

import { createContext, useContext } from "react";
import type { GuessedPlayer, MultiGameState } from "@/lib/game/engine";
import type { Subject } from "@/lib/subjects";

export interface EndAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline";
}

/**
 * One board, two backends: the local provider (useState + applyTurn) and the
 * online provider (Convex room) both publish this shape, so every board
 * component works unchanged in either mode.
 */
export interface MultiGameContextValue {
  state: MultiGameState;
  subject: Subject;
  /** The seat this device throws from. Local mode: whoever holds the phone. */
  mySeatIndex: number;
  isMyTurn: boolean;
  /** Epoch ms the current turn forfeits at; null = no shot clock. */
  turnDeadline: number | null;
  /** Configured turn length in seconds; null = no shot clock. */
  turnSeconds: number | null;
  roomCode: string | null;
  submitGuess: (player: GuessedPlayer) => void | Promise<void>;
  /** Buttons for the end overlay (rematch, new board, …). */
  endActions: EndAction[];
  /** Shown under the end actions, e.g. "Waiting on the host…". */
  endNote: string | null;
}

export const MultiGameContext = createContext<MultiGameContextValue | null>(
  null,
);

export function useMultiGame(): MultiGameContextValue {
  const value = useContext(MultiGameContext);
  if (!value) {
    throw new Error("useMultiGame must be used inside a multi game provider");
  }
  return value;
}
