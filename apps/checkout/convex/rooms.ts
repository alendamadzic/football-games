import { v } from "convex/values";
// Relative import: the Convex bundler doesn't resolve the "@/" alias. The
// engine must stay import-free (never pull in src/lib/tm/* — "server-only"
// breaks the isolate build).
import {
  applyTurn,
  createMultiGame,
  STARTING_SCORE,
} from "../src/lib/game/engine";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { guessedPlayer, subject } from "./schema";

// No 0/O or 1/I — codes get read out across a pub table.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;
const MAX_MEMBERS = 6;
const DEFAULT_TURN_SECONDS = 300;

function randomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

async function roomByCode(
  ctx: QueryCtx,
  code: string,
): Promise<Doc<"rooms"> | null> {
  return await ctx.db
    .query("rooms")
    .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
    .unique();
}

async function requireRoom(ctx: QueryCtx, code: string): Promise<Doc<"rooms">> {
  const room = await roomByCode(ctx, code);
  if (!room) throw new Error("Room not found");
  return room;
}

function requireHost(room: Doc<"rooms">, deviceId: string) {
  if (room.hostDeviceId !== deviceId) {
    throw new Error("Only the host can do that");
  }
}

function cleanName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 20) {
    throw new Error("Name must be 1-20 characters");
  }
  return trimmed;
}

/**
 * Kick off the shot clock for the turn that is starting now. Fire-and-forget:
 * if a move lands before the clock runs out, turnCount moves on and the
 * scheduled forfeit no-ops.
 */
async function armShotClock(
  ctx: MutationCtx,
  room: { _id: Id<"rooms">; turnSeconds: number; turnCount: number },
): Promise<number | null> {
  if (room.turnSeconds <= 0) return null;
  await ctx.scheduler.runAfter(
    room.turnSeconds * 1000,
    internal.rooms.forfeitExpiredTurn,
    { roomId: room._id, expectedTurnCount: room.turnCount },
  );
  return Date.now() + room.turnSeconds * 1000;
}

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await roomByCode(ctx, args.code);
  },
});

export const createRoom = mutation({
  args: { deviceId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const name = cleanName(args.name);
    let code = randomCode();
    for (let attempt = 0; attempt < 8; attempt++) {
      if (!(await roomByCode(ctx, code))) break;
      code = randomCode();
    }
    const now = Date.now();
    await ctx.db.insert("rooms", {
      code,
      hostDeviceId: args.deviceId,
      members: [{ deviceId: args.deviceId, name, joinedAt: now }],
      seatDeviceIds: [],
      subject: null,
      limit180: false,
      startScore: STARTING_SCORE,
      turnSeconds: DEFAULT_TURN_SECONDS,
      turnDeadline: null,
      turnCount: 0,
      state: null,
      createdAt: now,
      updatedAt: now,
    });
    return { code };
  },
});

export const joinRoom = mutation({
  args: { code: v.string(), deviceId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    const name = cleanName(args.name);

    // Rejoin: the same device keeps its seat, even mid-game (page refresh).
    if (room.members.some((member) => member.deviceId === args.deviceId)) {
      await ctx.db.patch("rooms", room._id, {
        members: room.members.map((member) =>
          member.deviceId === args.deviceId ? { ...member, name } : member,
        ),
        updatedAt: Date.now(),
      });
      return null;
    }

    if (room.state !== null) throw new Error("That game is already underway");
    if (room.members.length >= MAX_MEMBERS) throw new Error("The oche is full");

    await ctx.db.patch("rooms", room._id, {
      members: [
        ...room.members,
        { deviceId: args.deviceId, name, joinedAt: Date.now() },
      ],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const leaveRoom = mutation({
  args: { code: v.string(), deviceId: v.string() },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    if (room.state !== null) throw new Error("Can't leave mid-game");

    const members = room.members.filter(
      (member) => member.deviceId !== args.deviceId,
    );
    if (members.length === 0) {
      await ctx.db.delete("rooms", room._id);
      return null;
    }
    await ctx.db.patch("rooms", room._id, {
      members,
      // The board passes to the next arrival if the host walks.
      hostDeviceId:
        room.hostDeviceId === args.deviceId
          ? members[0].deviceId
          : room.hostDeviceId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateSettings = mutation({
  args: {
    code: v.string(),
    deviceId: v.string(),
    turnSeconds: v.optional(v.number()),
    subject: v.optional(v.union(subject, v.null())),
    limit180: v.optional(v.boolean()),
    startScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    requireHost(room, args.deviceId);
    if (room.state !== null)
      throw new Error("Settings lock once the game starts");

    const patch: Partial<Doc<"rooms">> = { updatedAt: Date.now() };
    if (args.turnSeconds !== undefined) {
      if (
        !Number.isInteger(args.turnSeconds) ||
        args.turnSeconds < 0 ||
        args.turnSeconds > 3600
      ) {
        throw new Error("Shot clock must be 0-3600 seconds");
      }
      patch.turnSeconds = args.turnSeconds;
    }
    if (args.subject !== undefined) patch.subject = args.subject;
    if (args.limit180 !== undefined) patch.limit180 = args.limit180;
    if (args.startScore !== undefined) {
      if (
        !Number.isInteger(args.startScore) ||
        args.startScore < 1 ||
        args.startScore > 999
      ) {
        throw new Error("Start score must be 1-999");
      }
      patch.startScore = args.startScore;
    }
    await ctx.db.patch("rooms", room._id, patch);
    return null;
  },
});

export const startGame = mutation({
  args: { code: v.string(), deviceId: v.string() },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    requireHost(room, args.deviceId);
    if (room.state !== null) throw new Error("Already underway");
    if (!room.subject) throw new Error("Pick a board first");
    if (room.members.length < 2) throw new Error("Need at least 2 throwers");

    const state = createMultiGame(
      room.members.map((member) => member.name),
      room.startScore,
      room.limit180,
    );
    const armed = {
      _id: room._id,
      turnSeconds: room.turnSeconds,
      turnCount: 1,
    };
    await ctx.db.patch("rooms", room._id, {
      state,
      seatDeviceIds: room.members.map((member) => member.deviceId),
      turnCount: 1,
      turnDeadline: await armShotClock(ctx, armed),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const submitGuess = mutation({
  args: { code: v.string(), deviceId: v.string(), player: guessedPlayer },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    const state = room.state;
    if (!state || state.phase !== "playing")
      throw new Error("No game underway");
    if (room.seatDeviceIds[state.activeIndex] !== args.deviceId) {
      throw new Error("Not your throw");
    }
    // The appearance count is resolved client-side (Transfermarkt lookup via
    // the Next server action) and attested here. Fine for a casual code-share
    // game: it's bounds-checked and every guess is public on the sheet. To
    // harden later, resolve inside a Convex action against TM_API_URL instead.
    const { apps, playerId, name } = args.player;
    if (!Number.isInteger(apps) || apps < 0 || apps > 2000) {
      throw new Error("Implausible appearance count");
    }
    if (playerId.length === 0 || playerId.length > 32 || name.length > 80) {
      throw new Error("Malformed player");
    }

    const next = applyTurn(state, { type: "guess", player: args.player });
    const turnCount = room.turnCount + 1;
    const armed = { _id: room._id, turnSeconds: room.turnSeconds, turnCount };
    await ctx.db.patch("rooms", room._id, {
      state: next,
      turnCount,
      turnDeadline:
        next.phase === "playing" ? await armShotClock(ctx, armed) : null,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const returnToLobby = mutation({
  args: { code: v.string(), deviceId: v.string() },
  handler: async (ctx, args) => {
    const room = await requireRoom(ctx, args.code);
    requireHost(room, args.deviceId);
    await ctx.db.patch("rooms", room._id, {
      state: null,
      seatDeviceIds: [],
      turnDeadline: null,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const forfeitExpiredTurn = internalMutation({
  args: { roomId: v.id("rooms"), expectedTurnCount: v.number() },
  handler: async (ctx, args) => {
    const room = await ctx.db.get("rooms", args.roomId);
    // Stale job: the room is gone, the game ended, or a move already landed.
    if (!room || !room.state || room.state.phase !== "playing") return null;
    if (room.turnCount !== args.expectedTurnCount) return null;

    const next = applyTurn(room.state, { type: "timeout" });
    const turnCount = room.turnCount + 1;
    const armed = { _id: room._id, turnSeconds: room.turnSeconds, turnCount };
    await ctx.db.patch("rooms", room._id, {
      state: next,
      turnCount,
      turnDeadline:
        next.phase === "playing" ? await armShotClock(ctx, armed) : null,
      updatedAt: Date.now(),
    });
    return null;
  },
});
