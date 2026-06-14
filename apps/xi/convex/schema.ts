import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const playerValidator = v.object({
  name: v.string(), // Full name e.g. "Peter Schmeichel"
  surname: v.string(), // e.g. "Schmeichel" — used for matching
  position: v.union(
    v.literal("GK"),
    v.literal("DEF"),
    v.literal("MID"),
    v.literal("FWD"),
  ),
  number: v.number(), // shirt number
  nationality: v.string(), // e.g. "Danish"
  transfermarktId: v.optional(v.string()), // e.g. "17259" — used for reliable photo lookup
});

export default defineSchema({
  matches: defineTable({
    slug: v.string(), // e.g. "ucl-final-1999"
    title: v.string(), // e.g. "The Treble Clincher"
    homeTeam: v.string(),
    awayTeam: v.string(),
    competition: v.string(),
    date: v.string(), // e.g. "26 May 1999"
    score: v.string(), // e.g. "2–1"
    scorers: v.string(),
    homePlayers: v.array(playerValidator),
    awayPlayers: v.array(playerValidator),
  }).index("by_slug", ["slug"]),

  userResults: defineTable({
    userId: v.string(),
    matchSlug: v.string(),
    date: v.string(), // UTC date string e.g. "2026-06-13"
    score: v.number(), // players correctly guessed out of 22
    livesRemaining: v.number(),
    timeTakenSeconds: v.number(),
    completed: v.boolean(),
    won: v.boolean(),
  }).index("by_user_date", ["userId", "date"]),

  userStats: defineTable({
    userId: v.string(),
    gamesPlayed: v.number(),
    gamesWon: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastPlayedDate: v.string(),
  }).index("by_user", ["userId"]),
});
