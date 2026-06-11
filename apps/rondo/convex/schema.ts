import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Validators that mirror the shared game types in `src/lib/game/types.ts`.
 * The authoritative `GameState` is reused verbatim from the client reducer, so
 * these must stay in sync with that file.
 */

export const restrictedPosition = v.union(
  v.literal("Goalkeeper"),
  v.literal("Defender"),
  v.literal("Midfielder"),
  v.literal("Attacker"),
);

export const restrictions = v.object({
  nationality: v.union(v.string(), v.null()),
  position: v.union(restrictedPosition, v.null()),
});

export const gameConfig = v.object({
  mode: v.union(v.literal("local"), v.literal("arcade")),
  turnSeconds: v.union(v.number(), v.literal("dynamic"), v.null()),
  lives: v.number(),
  playerNames: v.array(v.string()),
  restrictions,
});

export const chainLink = v.union(
  v.object({
    kind: v.literal("club"),
    id: v.string(),
    name: v.string(),
    badge: v.union(v.string(), v.null()),
  }),
  v.object({
    kind: v.literal("player"),
    id: v.string(),
    name: v.string(),
    linkedClubId: v.union(v.string(), v.null()),
    teamName: v.union(v.string(), v.null()),
  }),
);

export const gamePlayer = v.object({
  id: v.string(),
  name: v.string(),
  lives: v.number(),
  eliminated: v.boolean(),
});

export const careerClub = v.object({ id: v.string(), name: v.string() });

export const eliminationInfo = v.object({
  playerId: v.string(),
  playerName: v.string(),
  attempted: v.union(v.string(), v.null()),
  reason: v.union(
    v.literal("wrong"),
    v.literal("timeout"),
    v.literal("gaveup"),
  ),
  eliminated: v.boolean(),
  livesLeft: v.number(),
  knownClubs: v.optional(v.array(careerClub)),
});

export const gameState = v.object({
  phase: v.union(
    v.literal("setup"),
    v.literal("playing"),
    v.literal("elimination"),
    v.literal("gameover"),
  ),
  mode: v.union(v.literal("local"), v.literal("arcade")),
  config: gameConfig,
  chain: v.array(chainLink),
  turnKind: v.union(v.literal("player"), v.literal("club")),
  usedClubIds: v.array(v.string()),
  usedClubNames: v.array(v.string()),
  usedPlayerIds: v.array(v.string()),
  players: v.array(gamePlayer),
  activePlayerIndex: v.number(),
  score: v.number(),
  lastElimination: v.union(eliminationInfo, v.null()),
  winnerId: v.union(v.string(), v.null()),
});

export const member = v.object({
  deviceId: v.string(),
  name: v.string(),
  connected: v.boolean(),
  joinedAt: v.number(),
});

export default defineSchema({
  rooms: defineTable({
    /** Short uppercase join code players type/share. */
    code: v.string(),
    hostDeviceId: v.string(),
    /** Lobby roster. Locked (no new members) once `state` is non-null. */
    members: v.array(member),
    /**
     * Device id per seat, aligned by index to `state.players`, so the active
     * player's device is `seatDeviceIds[state.activePlayerIndex]`.
     */
    seatDeviceIds: v.array(v.string()),
    /** When the current turn started — lets all clients render the timer. */
    turnStartedAt: v.union(v.number(), v.null()),
    /** The authoritative game state. `null` while in the lobby. */
    state: v.union(gameState, v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),
});
