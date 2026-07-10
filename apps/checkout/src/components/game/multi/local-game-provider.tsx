"use client";

import { type ReactNode, useState } from "react";
import {
  MultiGameContext,
  type MultiGameContextValue,
} from "@/components/game/multi/game-context";
import {
  applyTurn,
  createMultiGame,
  type GuessedPlayer,
} from "@/lib/game/engine";
import type { Subject } from "@/lib/subjects";

interface LocalGameProviderProps {
  names: string[];
  subject: Subject;
  startScore: number;
  limit180: boolean;
  /** Back to the subject grid, same table. */
  onNewBoard: () => void;
  /** Back to name entry. */
  onNewPlayers: () => void;
  children: ReactNode;
}

/** Pass-the-device mode: whoever holds the phone is the active seat. */
export function LocalGameProvider({
  names,
  subject,
  startScore,
  limit180,
  onNewBoard,
  onNewPlayers,
  children,
}: LocalGameProviderProps) {
  const [state, setState] = useState(() =>
    createMultiGame(names, startScore, limit180),
  );

  const value: MultiGameContextValue = {
    state,
    subject,
    mySeatIndex: state.activeIndex,
    isMyTurn: true,
    turnDeadline: null,
    turnSeconds: null,
    roomCode: null,
    submitGuess: (player: GuessedPlayer) => {
      setState((current) => applyTurn(current, { type: "guess", player }));
    },
    endActions: [
      {
        label: "Go again",
        onClick: () => setState(createMultiGame(names, startScore, limit180)),
      },
      { label: "New board", onClick: onNewBoard, variant: "outline" },
      { label: "New players", onClick: onNewPlayers, variant: "outline" },
    ],
    endNote: null,
  };

  return (
    <MultiGameContext.Provider value={value}>
      {children}
    </MultiGameContext.Provider>
  );
}
