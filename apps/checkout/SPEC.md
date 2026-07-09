# Build: checkout.

A single-player football trivia game that plays like a darts 501 checkout. Build this inside the existing Next.js project — follow whatever project skills, conventions, and shadcn/ui theme are already set up, but you have full creative freedom on the actual look and feel. This should feel like a genuine hybrid of a darts scoreboard and a football stats app, not a generic quiz UI. Lean into that identity: scoreboard typography, checkout language ("game on", "busted", "checkout!"), satisfying score-ticking animations, the works.

## Game Concept

The player starts on a score of **501**. They're given a club or country. They then name players who have appeared for that club/country, and each correct name subtracts that player's **total career appearances** (all competitions) for that club/country from the running score. The goal is to land on **exactly 0** — same logic as a darts checkout.

## Core Rules

1. **Starting score:** 501.
2. **Selecting a subject:** the player picks a club or country to play from a curated list (see below) before the round starts.
3. **Naming a player:** the player types/searches a player name who has appeared for that club/country. If valid, their total career appearances for that club/country are subtracted from the current score.
4. **Overshoot ("bust"):** if a player's appearance count would take the score below 0, that guess does not count — the score stays where it was, that player is marked as burned (can't be tried again this round), and it counts as a strike.
5. **Invalid player:** naming someone who never played for that club/country is also a strike, and does not affect the score.
6. **Duplicate player:** naming someone already used earlier in the round is also a strike, and does not affect the score.
7. **Strike limit:** 3 strikes (of any combination of the above) ends the round — game over.
8. **Win condition:** score hits exactly 0. Show a clear "checkout!" celebration state.
9. **No timer.** This is about finding the route to zero, not speed.
10. **Stateless:** no persistence between sessions. No stats, no history, no accounts. Refreshing or starting a new round just resets everything client-side.

## Data Source

Use **TheSportsDB** API (same one used in the rondo. and xi. projects) fetched client-side — no backend, no Convex, no server-side caching layer. All lookups happen live against the API during play.

You'll need to:
- Resolve a selected club/country to its TheSportsDB team/country ID.
- Look up a searched player and confirm they're associated with that club/country.
- Retrieve that player's appearance count for that club/country specifically (not total career appearances across all clubs).

**Important data caveat:** TheSportsDB's appearance data is inconsistent in coverage — some players/clubs are well populated, others are missing or incomplete. Handle this gracefully:
- If a searched player exists but has no appearance data for the selected club/country, treat it as an invalid player (strike) with a clear message, rather than crashing or silently allowing a 0-value guess.
- Consider a lightweight autocomplete/search-as-you-type on the player name field so users aren't guessing exact spellings, since this game lives or dies on the guess-matching feeling fair.

## Curated Subject List

Don't rely on open-ended search for the subject (club/country) selection. Build a **curated, sensible list** of major clubs and major footballing nations — think top European clubs (Premier League, La Liga, Serie A, Bundesliga, Ligue 1 heavyweights) and the world's most prominent national teams. Resolve each to its TheSportsDB ID up front. This list should feel authoritative and give a good spread of difficulty, not just the same five obvious teams every time.

## UX & Theming Direction

- You have creative freedom here — use the existing shadcn/ui theme as a structural base, but don't feel bound to default shadcn styling. This should look and feel bespoke.
- Take visual inspiration from darts scoreboards (bold numerals, high contrast, that "big number ticking down" satisfaction) blended with football matchday aesthetics.
- Make busting feel distinct and clear (not punishing, just clean feedback) and checking out feel like a genuine win moment.
- Show the running score prominently at all times, plus strikes remaining, plus a list of players already used (and their appearance values) so the player can track their own route down.
- Fully responsive — this should work well on mobile.

## Scope for This Build

Single-player only. No multiplayer, no daily challenge, no leaderboard, no persistence layer. Focus entirely on making the core loop — pick subject, name players, watch the score tick down, bust or checkout — feel tight and satisfying.
