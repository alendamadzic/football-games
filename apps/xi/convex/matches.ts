import { query } from "./_generated/server";

// Today's match is deterministic per UTC calendar day: every player sees the
// same match on the same day. Seeded against the match pool by days-since-epoch.
export const getTodaysMatch = query({
  args: {},
  handler: async ({ db }) => {
    const matches = await db.query("matches").collect();
    if (matches.length === 0) return null;
    // Stable ordering so the index doesn't shift if insertion order changes.
    matches.sort((a, b) => a.slug.localeCompare(b.slug));
    const msPerDay = 86400000;
    const daysSinceEpoch = Math.floor(Date.now() / msPerDay);
    const index = daysSinceEpoch % matches.length;
    return matches[index];
  },
});
