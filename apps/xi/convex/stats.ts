import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getStats = query({
  args: { userId: v.string() },
  handler: async ({ db }, { userId }) => {
    return await db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

// Returns the UTC date string ("YYYY-MM-DD") that is `days` before `date`.
function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Updates aggregate stats after a completed game. Idempotent per day: calling
// twice for the same lastPlayedDate is a no-op so refreshes don't double-count.
export const updateStats = mutation({
  args: {
    userId: v.string(),
    date: v.string(), // UTC date of the game just completed
    won: v.boolean(),
  },
  handler: async ({ db }, { userId, date, won }) => {
    const existing = await db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!existing) {
      await db.insert("userStats", {
        userId,
        gamesPlayed: 1,
        gamesWon: won ? 1 : 0,
        currentStreak: won ? 1 : 0,
        longestStreak: won ? 1 : 0,
        lastPlayedDate: date,
      });
      return;
    }

    // Already recorded a game for this date — don't double count.
    if (existing.lastPlayedDate === date) return;

    const playedYesterday = existing.lastPlayedDate === shiftDate(date, -1);
    const currentStreak = won ? (playedYesterday ? existing.currentStreak + 1 : 1) : 0;

    await db.patch(existing._id, {
      gamesPlayed: existing.gamesPlayed + 1,
      gamesWon: existing.gamesWon + (won ? 1 : 0),
      currentStreak,
      longestStreak: Math.max(existing.longestStreak, currentStreak),
      lastPlayedDate: date,
    });
  },
});
