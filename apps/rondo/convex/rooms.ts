import { v } from "convex/values";
// Relative import: the Convex bundler doesn't resolve the app's "@/" alias.
// `reducer.ts` and its `normalizeClubName` dependency are pure, isolate-safe modules.
import { createInitialState, gameReducer } from "../src/lib/game/reducer";
import type { GameState } from "../src/lib/game/types";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { careerClub, chainLink, gameConfig } from "./schema";

const failReason = v.union(
  v.literal("wrong"),
  v.literal("timeout"),
  v.literal("gaveup"),
);

const seedClub = v.object({
  id: v.string(),
  name: v.string(),
  badge: v.union(v.string(), v.null()),
});

// Unambiguous alphabet (no 0/O/1/I) for spoken/typed join codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;

function randomCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

async function roomByCode(ctx: MutationCtx, code: string) {
  return ctx.db
    .query("rooms")
    .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
    .unique();
}

/** Live room subscription source. */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .unique();
  },
});

export const createRoom = mutation({
  args: { hostDeviceId: v.string(), hostName: v.string() },
  handler: async (ctx, { hostDeviceId, hostName }) => {
    // Find a free code (collisions are rare; retry a handful of times).
    let code = randomCode();
    for (let i = 0; i < 8 && (await roomByCode(ctx, code)); i++) {
      code = randomCode();
    }
    const now = Date.now();
    await ctx.db.insert("rooms", {
      code,
      hostDeviceId,
      members: [
        {
          deviceId: hostDeviceId,
          name: hostName.trim() || "Host",
          connected: true,
          joinedAt: now,
        },
      ],
      seatDeviceIds: [],
      turnStartedAt: null,
      state: null,
      createdAt: now,
      updatedAt: now,
    });
    return { code };
  },
});

export const joinRoom = mutation({
  args: { code: v.string(), deviceId: v.string(), name: v.string() },
  handler: async (ctx, { code, deviceId, name }) => {
    const room = await roomByCode(ctx, code);
    if (!room) throw new Error("Room not found");

    const existing = room.members.find((m) => m.deviceId === deviceId);
    if (existing) {
      // Rejoin: refresh name + mark connected, keep their seat.
      const members = room.members.map((m) =>
        m.deviceId === deviceId
          ? { ...m, name: name.trim() || m.name, connected: true }
          : m,
      );
      await ctx.db.patch(room._id, { members, updatedAt: Date.now() });
      return { code: room.code };
    }

    // New member only allowed before the game starts.
    if (room.state !== null) throw new Error("Game already started");

    await ctx.db.patch(room._id, {
      members: [
        ...room.members,
        {
          deviceId,
          name: name.trim() || `Player ${room.members.length + 1}`,
          connected: true,
          joinedAt: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    });
    return { code: room.code };
  },
});

/** Builds a fresh authoritative game state from the current lobby roster. */
function buildGameState(
  room: { members: { name: string }[] },
  config: {
    turnSeconds: GameState["config"]["turnSeconds"];
    lives: number;
    restrictions: GameState["config"]["restrictions"];
  },
  seed: { id: string; name: string; badge: string | null },
): GameState {
  return createInitialState({
    config: {
      mode: "local",
      turnSeconds: config.turnSeconds,
      lives: config.lives,
      playerNames: room.members.map((m) => m.name),
      restrictions: config.restrictions,
    },
    seed,
  });
}

export const startGame = mutation({
  args: {
    code: v.string(),
    hostDeviceId: v.string(),
    config: gameConfig,
    seed: seedClub,
  },
  handler: async (ctx, { code, hostDeviceId, config, seed }) => {
    const room = await roomByCode(ctx, code);
    if (!room) throw new Error("Room not found");
    if (room.hostDeviceId !== hostDeviceId)
      throw new Error("Only the host can start the game");
    if (room.members.length < 2)
      throw new Error("Need at least two players to start");

    const state = buildGameState(room, config, seed);
    await ctx.db.patch(room._id, {
      state,
      seatDeviceIds: room.members.map((m) => m.deviceId),
      turnStartedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const submitValid = mutation({
  args: { code: v.string(), deviceId: v.string(), link: chainLink },
  handler: async (ctx, { code, deviceId, link }) => {
    const room = await roomByCode(ctx, code);
    if (!room?.state) throw new Error("No active game");
    const activeDevice = room.seatDeviceIds[room.state.activePlayerIndex];
    if (activeDevice !== deviceId) throw new Error("Not your turn");

    const next = gameReducer(room.state, { type: "SUBMIT_VALID", link });
    await ctx.db.patch(room._id, {
      state: next,
      turnStartedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const fail = mutation({
  args: {
    code: v.string(),
    deviceId: v.string(),
    reason: failReason,
    attempted: v.union(v.string(), v.null()),
    knownClubs: v.optional(v.array(careerClub)),
  },
  handler: async (ctx, { code, deviceId, reason, attempted, knownClubs }) => {
    const room = await roomByCode(ctx, code);
    if (!room?.state) throw new Error("No active game");
    const activeDevice = room.seatDeviceIds[room.state.activePlayerIndex];
    if (activeDevice !== deviceId) throw new Error("Not your turn");

    const next = gameReducer(room.state, {
      type: "FAIL",
      reason,
      attempted,
      knownClubs,
    });
    await ctx.db.patch(room._id, { state: next, updatedAt: Date.now() });
  },
});

export const continueTurn = mutation({
  args: { code: v.string(), hostDeviceId: v.string() },
  handler: async (ctx, { code, hostDeviceId }) => {
    const room = await roomByCode(ctx, code);
    if (!room?.state) throw new Error("No active game");
    if (room.hostDeviceId !== hostDeviceId)
      throw new Error("Only the host can advance the game");

    const next = gameReducer(room.state, { type: "CONTINUE" });
    await ctx.db.patch(room._id, {
      state: next,
      turnStartedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/** Host safety valve: force-fail the current (likely absent) player's turn. */
export const skipTurn = mutation({
  args: { code: v.string(), hostDeviceId: v.string() },
  handler: async (ctx, { code, hostDeviceId }) => {
    const room = await roomByCode(ctx, code);
    if (!room?.state) throw new Error("No active game");
    if (room.hostDeviceId !== hostDeviceId)
      throw new Error("Only the host can skip a turn");

    const next = gameReducer(room.state, {
      type: "FAIL",
      reason: "gaveup",
      attempted: null,
    });
    await ctx.db.patch(room._id, { state: next, updatedAt: Date.now() });
  },
});

export const rematch = mutation({
  args: {
    code: v.string(),
    hostDeviceId: v.string(),
    config: gameConfig,
    seed: seedClub,
  },
  handler: async (ctx, { code, hostDeviceId, config, seed }) => {
    const room = await roomByCode(ctx, code);
    if (!room) throw new Error("Room not found");
    if (room.hostDeviceId !== hostDeviceId)
      throw new Error("Only the host can start a rematch");

    const state = buildGameState(room, config, seed);
    await ctx.db.patch(room._id, {
      state,
      seatDeviceIds: room.members.map((m) => m.deviceId),
      turnStartedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
