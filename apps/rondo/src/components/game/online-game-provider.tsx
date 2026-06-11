"use client";

import { useMutation } from "convex/react";
import { useCallback, useMemo, useRef } from "react";
import type { GameAction, GameState } from "@/lib/game/types";
import {
  getStartingClubAction,
  verifyLinkAction,
} from "@/lib/sportsdb/actions";
import type { VerifyResult } from "@/lib/sportsdb/types";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { GameContext, type GameContextValue } from "./game-provider";

type Room = Doc<"rooms"> & { state: GameState };

/**
 * Publishes a Convex-backed room into the same GameContext the local provider
 * uses, so every shared game component (GameScreen, AnswerInput, etc.) works
 * unchanged. Only mounted once the room has an active `state` (not in lobby).
 */
export function OnlineGameProvider({
  room,
  deviceId,
  children,
}: {
  room: Room;
  deviceId: string;
  children: React.ReactNode;
}) {
  const state = room.state;
  const code = room.code;

  const isHost = room.hostDeviceId === deviceId;
  const isMyTurn = room.seatDeviceIds[state.activePlayerIndex] === deviceId;

  const submitValidMut = useMutation(api.rooms.submitValid);
  const failMut = useMutation(api.rooms.fail);
  const continueMut = useMutation(api.rooms.continueTurn);
  const skipMut = useMutation(api.rooms.skipTurn);
  const rematchMut = useMutation(api.rooms.rematch);

  // Reuse the existing per-link verification (still runs on the active device).
  const verifyCache = useRef(new Map<string, VerifyResult>());
  const verifyLink = useCallback(
    async (playerId: string, clubId: string, clubName: string) => {
      const key = `${playerId}:${clubId}`;
      const cached = verifyCache.current.get(key);
      if (cached) return cached;
      const result = await verifyLinkAction(playerId, clubId, clubName);
      if (result.status !== "error") verifyCache.current.set(key, result);
      return result;
    },
    [],
  );

  // Translate the actions the shared components already emit into mutations.
  const dispatch = useCallback(
    (action: GameAction) => {
      switch (action.type) {
        case "SUBMIT_VALID":
          void submitValidMut({ code, deviceId, link: action.link });
          break;
        case "FAIL":
          void failMut({
            code,
            deviceId,
            reason: action.reason,
            attempted: action.attempted,
            knownClubs: action.knownClubs,
          });
          break;
        case "CONTINUE":
          void continueMut({ code, hostDeviceId: deviceId });
          break;
        // START / RESET are driven by the lobby/rematch flows, not here.
        default:
          break;
      }
    },
    [code, deviceId, submitValidMut, failMut, continueMut],
  );

  const skipTurn = useCallback(() => {
    void skipMut({ code, hostDeviceId: deviceId });
  }, [code, deviceId, skipMut]);

  const rematch = useCallback(() => {
    void (async () => {
      const seed = await getStartingClubAction(state.config.restrictions);
      if (!seed) return;
      await rematchMut({
        code,
        hostDeviceId: deviceId,
        config: state.config,
        seed: { id: seed.id, name: seed.name, badge: seed.badge },
      });
    })();
  }, [code, deviceId, rematchMut, state.config]);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      mode: "local",
      dispatch,
      starting: false,
      startError: null,
      startGame: async () => {},
      resetToSetup: () => {},
      verifyLink,
      isOnline: true,
      isMyTurn,
      isHost,
      skipTurn,
      rematch,
    }),
    [state, dispatch, verifyLink, isMyTurn, isHost, skipTurn, rematch],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
