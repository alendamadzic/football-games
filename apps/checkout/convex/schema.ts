import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// These validators mirror the engine types in src/lib/game/engine.ts and the
// Subject type in src/lib/subjects.ts — keep them in sync when either changes.

export const guessedPlayer = v.object({
  playerId: v.string(),
  name: v.string(),
  imageUrl: v.union(v.string(), v.null()),
  apps: v.number(),
});

export const turnStatus = v.union(
  v.literal("scored"),
  v.literal("bust"),
  v.literal("invalid"),
  v.literal("duplicate"),
  v.literal("over"),
  v.literal("timeout"),
);

export const multiGuessEntry = v.object({
  seatIndex: v.number(),
  player: v.union(guessedPlayer, v.null()),
  status: turnStatus,
  scoreBefore: v.number(),
  scoreAfter: v.number(),
});

export const multiPlayer = v.object({
  id: v.string(),
  name: v.string(),
  score: v.number(),
  strikes: v.number(),
  eliminated: v.boolean(),
});

export const multiGameState = v.object({
  phase: v.union(v.literal("playing"), v.literal("over")),
  players: v.array(multiPlayer),
  activeIndex: v.number(),
  usedPlayerIds: v.array(v.string()),
  guesses: v.array(multiGuessEntry),
  winnerIndex: v.union(v.number(), v.null()),
  endReason: v.union(
    v.literal("checkout"),
    v.literal("last-standing"),
    v.literal("all-out"),
    v.null(),
  ),
  limit180: v.boolean(),
});

export const subject = v.object({
  id: v.string(),
  name: v.string(),
  shortName: v.string(),
  kind: v.union(v.literal("club"), v.literal("nation")),
  tier: v.union(v.literal(1), v.literal(2), v.literal(3)),
  detail: v.string(),
});

export default defineSchema({
  // One document per game room; a single getByCode subscription drives the
  // whole lobby → game → end flow on every client.
  rooms: defineTable({
    code: v.string(),
    hostDeviceId: v.string(),
    members: v.array(
      v.object({
        deviceId: v.string(),
        name: v.string(),
        joinedAt: v.number(),
      }),
    ),
    /** Index-aligned with state.players; maps seats to devices for turn auth. */
    seatDeviceIds: v.array(v.string()),
    subject: v.union(subject, v.null()),
    limit180: v.boolean(),
    startScore: v.number(),
    /** Shot clock length in seconds; 0 = no clock. */
    turnSeconds: v.number(),
    /** Epoch ms the current turn forfeits at; drives every client's ring. */
    turnDeadline: v.union(v.number(), v.null()),
    /** Bumped on every applied turn — staleness guard for scheduled forfeits. */
    turnCount: v.number(),
    /** null = still in the lobby. */
    state: v.union(multiGameState, v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),
});
