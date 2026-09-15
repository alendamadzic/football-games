"use client";

import { useMutation } from "convex/react";
import type { ReactNode } from "react";
import {
  MultiGameContext,
  type MultiGameContextValue,
} from "@/components/game/multi/game-context";
import type { GuessedPlayer, MultiGameState } from "@/lib/game/engine";
import type { Subject } from "@/lib/subjects";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

/** Adapts a live Convex room into the same context the local provider fills. */
export function OnlineGameProvider({
  room,
  deviceId,
  children,
}: {
  room: Doc<"rooms"> & { state: MultiGameState; subject: Subject };
  deviceId: string;
  children: ReactNode;
}) {
  const submitGuess = useMutation(api.rooms.submitGuess);
  const returnToLobby = useMutation(api.rooms.returnToLobby);

  const { state } = room;
  const mySeatIndex = room.seatDeviceIds.indexOf(deviceId);
  const isHost = room.hostDeviceId === deviceId;

  const value: MultiGameContextValue = {
    state,
    subject: room.subject,
    mySeatIndex,
    isMyTurn: state.phase === "playing" && mySeatIndex === state.activeIndex,
    turnDeadline: room.turnDeadline,
    turnSeconds: room.turnSeconds > 0 ? room.turnSeconds : null,
    roomCode: room.code,
    submitGuess: async (player: GuessedPlayer) => {
      await submitGuess({ code: room.code, deviceId, player });
    },
    endActions: isHost
      ? [
          {
            label: "Back to the lobby",
            onClick: () => {
              void returnToLobby({ code: room.code, deviceId });
            },
          },
        ]
      : [],
    endNote: isHost ? null : "Waiting on the host to rechalk the board…",
  };

  return (
    <MultiGameContext.Provider value={value}>
      {children}
    </MultiGameContext.Provider>
  );
}
