import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Upsert a user's result for a given date (one game per UTC day).
export const saveResult = mutation({
  args: {
    userId: v.string(),
    matchSlug: v.string(),
    date: v.string(),
    score: v.number(),
    livesRemaining: v.number(),
    timeTakenSeconds: v.number(),
    completed: v.boolean(),
    won: v.boolean(),
  },
  handler: async ({ db }, args) => {
    const existing = await db
      .query("userResults")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date),
      )
      .unique();

    if (existing) {
      await db.patch(existing._id, args);
      return existing._id;
    }
    return await db.insert("userResults", args);
  },
});

export const getResultForDate = query({
  args: { userId: v.string(), date: v.string() },
  handler: async ({ db }, { userId, date }) => {
    return await db
      .query("userResults")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", date),
      )
      .unique();
  },
});
