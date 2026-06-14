import { internalMutation } from "./_generated/server";
import { MATCHES } from "./data/matches";

// Clears the matches table and re-inserts the full dataset. Run with:
//   bunx convex run seed:seedMatches
export const seedMatches = internalMutation({
  args: {},
  handler: async ({ db }) => {
    const existing = await db.query("matches").collect();
    for (const m of existing) {
      await db.delete(m._id);
    }
    for (const m of MATCHES) {
      await db.insert("matches", m);
    }
    return { inserted: MATCHES.length };
  },
});
