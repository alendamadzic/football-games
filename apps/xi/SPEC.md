# Claude Code Prompt — xi.

## Starting Point — Read This First

You are working inside an **existing Next.js boilerplate** with the App Router already configured. Before writing a single line of code, you must:

1. **Study the codebase thoroughly** — read the directory structure, `package.json`, `next.config.ts`, `tailwind.config.ts`, and any existing files under `app/`, `components/`, and `lib/`. Understand what is already there before adding anything.
2. **Check the shadcn/ui setup** — inspect `components/ui/` and any theme configuration (e.g. `app/globals.css`, CSS variables). The boilerplate already has shadcn installed with some base theming. Extend and respect the existing theme rather than overriding it.
3. **Do not scaffold a new Next.js app** — you are building inside what already exists. Add files and directories, don't replace the project structure.
4. **Check existing dependencies** in `package.json` before installing anything — Tailwind, shadcn, and other common packages may already be present.

---

## Project Overview

Build a daily football trivia web game called **xi.** (always lowercase, always with the full stop). The concept: every day, a famous historical football match is revealed and the player must guess the starting XI for both teams — all 22 players — before running out of lives.

The aesthetic and brand should feel clean, minimal, dark-mode first, with a football-specific identity. The name "xi." is the brand; treat the full stop as part of the logo.

---

## Tech Stack

- **Framework:** Next.js (App Router) — already set up in the boilerplate
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui — already set up, extend the existing theme
- **Backend/DB:** Convex (real-time serverless database) — install and configure this
- **Hosting:** Vercel
- **No external football API** — all match data is seeded directly into Convex

---

## Next.js Configuration — cacheComponents

Enable `cacheComponents` in `next.config.ts`. This is a Next.js 16 feature that enables component and function-level caching via the `use cache` directive, and implements Partial Prerendering (PPR) as the default rendering behaviour.

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

**Where to apply `use cache` in xi.:**

- The today's match data fetched from Convex (the match details for the current puzzle) should be wrapped with `use cache` — it changes once per day and is the same for all users, making it an ideal candidate
- Any static content components (match header display, competition badge) can use `use cache`
- User-specific data (results, stats, game state) must **not** be cached — keep those dynamic via Convex real-time queries
- Use `cacheTag` to tag match cache entries so they can be invalidated when needed

Example pattern:
```ts
import { unstable_cacheTag as cacheTag } from 'next/cache'

async function getTodaysMatch() {
  'use cache'
  cacheTag('daily-match')
  // fetch today's match from Convex here
}
```

---

## Convex Setup

Install and initialise Convex in the project. Define the following schema in `convex/schema.ts`:

### `matches` table
```ts
{
  slug: v.string(),            // e.g. "ucl-final-1999"
  title: v.string(),           // e.g. "The Treble Clincher"
  homeTeam: v.string(),        // e.g. "Manchester United"
  awayTeam: v.string(),
  competition: v.string(),     // e.g. "UEFA Champions League Final"
  date: v.string(),            // e.g. "26 May 1999"
  score: v.string(),           // e.g. "2–1"
  scorers: v.string(),         // e.g. "Sheringham 91', Solskjær 93' / Basler 6'"
  homePlayers: v.array(playerValidator),
  awayPlayers: v.array(playerValidator),
}
```

### `Player` validator (shared type)
```ts
const playerValidator = v.object({
  name: v.string(),          // Full name e.g. "Peter Schmeichel"
  surname: v.string(),       // e.g. "Schmeichel" — used for matching
  position: v.union(v.literal("GK"), v.literal("DEF"), v.literal("MID"), v.literal("FWD")),
  number: v.number(),        // shirt number
  nationality: v.string(),   // e.g. "Danish"
})
```

### `userResults` table
```ts
{
  userId: v.string(),        // UUID generated on first visit
  matchSlug: v.string(),
  date: v.string(),          // UTC date string e.g. "2026-06-13"
  score: v.number(),         // players correctly guessed out of 22
  livesRemaining: v.number(),
  cluesUsed: v.number(),
  timeTakenSeconds: v.number(),
  completed: v.boolean(),
  won: v.boolean(),
}
```

### `userStats` table
```ts
{
  userId: v.string(),
  gamesPlayed: v.number(),
  gamesWon: v.number(),
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastPlayedDate: v.string(),
}
```

---

## Daily Match Selection

- Determine today's match by seeding today's UTC date against the match pool index
- Same match for every player on the same UTC calendar day
- Implement as a Convex query so it's consistent server-side

```ts
// convex/matches.ts
export const getTodaysMatch = query(async ({ db }) => {
  const matches = await db.query("matches").collect()
  const msPerDay = 86400000
  const daysSinceEpoch = Math.floor(Date.now() / msPerDay)
  const index = daysSinceEpoch % matches.length
  return matches[index]
})
```

---

## User Identity

- On first visit, generate a UUID and store in `localStorage` as `xi_user_id`
- All results and stats are keyed to this UUID in Convex
- No auth required for v1 — UUID is the identity
- If a user clears storage they get a fresh identity (acceptable trade-off for v1)

---

## Game Mechanics

### Setup
- Show the match header: title, teams, competition, date
- Show two columns (home team | away team), each with 11 empty slots
- Show lives (3 hearts) and clues (3 lightbulbs) in the header
- Show a running timer

### Guessing
- Single text input at the bottom of the screen
- As the user types, show autocomplete suggestions filtered from all 22 players' surnames (fuzzy match, debounced at ~150ms)
- On selection or Enter: check if surname matches any unguessed player (case-insensitive, trimmed)
- **Correct:** reveal that player's slot with name + position + shirt number — animate it in
- **Wrong:** subtract one life; show a brief "wrong" flash on the input; log the wrong guess visibly below the input
- Surname match only — "Schmeichel" matches "Peter Schmeichel". First name not required.
- Fuzzy matching: allow 1–2 character typos (e.g. "Schmichel" → "Schmeichel")

### Clues
- Button to use a clue (costs 1 of 3 clues)
- Randomly selects one unguessed player and reveals ONE of: position, shirt number, nationality, or first letter of surname
- Which hint type is random each time
- Display the clue as a subtle badge on the relevant empty slot

### Lives
- 3 lives total across the whole game (not per team)
- Each wrong guess = −1 life
- 0 lives = game over → trigger end screen

### Win condition
- All 22 players correctly guessed = win → trigger end screen

---

## End Screen

### Results summary (shown first)
- Score: X / 22 players guessed
- Lives remaining: X / 3
- Clues used: X / 3
- Time taken: MM:SS
- Win/loss status with appropriate message

### Match reveal
- Match summary card: full result, scorers, competition, date
- Then reveal both full lineups (home | away), all 22 players with name, number, position
- Players correctly guessed: highlighted green
- Players missed: highlighted red

### Share card
- Emoji-style shareable grid:
  ```
  xi. — [Match Title]
  ⚽ [score]/22 | ❤️ [lives left] | 💡 [clues used] | ⏱️ [time]
  🟩🟩🟩🟥🟩🟩🟥🟩🟩🟩🟩 (home team — one square per player)
  🟩🟥🟩🟩🟩🟩🟩🟥🟩🟩🟩 (away team)
  ```
- "Share result" button: copies the text string to clipboard AND renders a downloadable image card (use `html2canvas` or similar)

---

## Match Dataset

Seed Convex with the following matches via a mutation in `convex/seed.ts`. Populate all player data accurately — full name, surname, position, shirt number, nationality for all 22 starters per match.

1. **Manchester United vs Bayern Munich** — UEFA Champions League Final, 26 May 1999 ("The Treble Clincher") — 2–1
2. **Liverpool vs AC Milan** — UEFA Champions League Final, 25 May 2005 ("The Miracle of Istanbul") — 3–3 aet (Liverpool win on pens)
3. **Brazil vs Germany** — FIFA World Cup Semi-Final, 8 July 2014 ("The Mineirazo") — 1–7
4. **Barcelona vs Manchester United** — UEFA Champions League Final, 28 May 2011 — 3–1
5. **France vs Croatia** — FIFA World Cup Final, 15 July 2018 — 4–2
6. **Germany vs Argentina** — FIFA World Cup Final, 13 July 2014 — 1–0 aet
7. **Real Madrid vs Atletico Madrid** — UEFA Champions League Final, 24 May 2014 — 4–1 aet
8. **England vs Germany** — FIFA World Cup Final, 30 July 1966 — 4–2 aet
9. **Argentina vs England** — FIFA World Cup Quarter-Final, 22 June 1986 ("Hand of God") — 2–1
10. **Netherlands vs Spain** — FIFA World Cup Final, 11 July 2010 — 0–1 aet
11. **Manchester City vs QPR** — Premier League, 13 May 2012 ("Aguerooo") — 3–2
12. **Liverpool vs Arsenal** — First Division, 26 May 1989 ("Michael Thomas") — 2–0
13. **Arsenal vs Manchester United** — Premier League, 8 May 2002 ("Invincibles clincher") — 1–0
14. **Real Madrid vs Barcelona** — La Liga, 23 April 2017 ("Messi's shirt-off Clásico") — 2–3
15. **Italy vs France** — FIFA World Cup Final, 9 July 2006 ("Zidane headbutt") — 1–1 aet (Italy win on pens)
16. **Spain vs Germany** — UEFA Euro 2008 Final, 29 June 2008 — 1–0
17. **Denmark vs Germany** — UEFA Euro 1992 Final, 26 June 1992 — 2–0
18. **Greece vs Portugal** — UEFA Euro 2004 Final, 4 July 2004 — 1–0
19. **AC Milan vs Liverpool** — UEFA Champions League Final, 25 May 2005 (reverse perspective from #2 — skip, use a different match instead)
20. **Manchester United vs Arsenal** — Premier League, 1 February 2005 ("Vieira vs Keane tunnel") — 4–2

> **Note to Claude Code:** Populate the full player data for all matches above, and add further matches to reach **at least 40 total**. Use your training knowledge for accurate starting XIs, shirt numbers, positions, and nationalities. Aim for diversity across: eras (1960s–2020s), competitions (domestic leagues, Champions League, World Cup, Euros), and nations (not just English clubs). Additional suggestions to draw from: Ajax vs AC Milan (UCL Final 1995), Brazil vs Italy (World Cup Final 1994), Germany vs Czech Republic (Euro 96 Final), Barcelona's 6–1 vs PSG (2017), Leicester City's title-winning season (2015/16 key matches), Liverpool 4–0 Barcelona (UCL semi 2019).

---

## UI Design

### Aesthetic
- Respect and extend the existing shadcn theme from the boilerplate
- Accent colour: bold green (`#16a34a` or similar — football pitch reference) unless the existing theme already has a strong accent
- Typography: bold, slightly condensed — confident and minimal
- The logo "xi." rendered prominently at the top — treat the full stop as a deliberate design element

### Colour Mode

The app must support three colour modes: **light**, **dark**, and **system** (follows the OS preference). This is a first-class feature, not an afterthought.

- Install `next-themes` if not already present in the boilerplate
- Wrap the app in `ThemeProvider` in `app/layout.tsx` with `attribute="class"`, `defaultTheme="system"`, and `enableSystem`
- All colours must use shadcn CSS variable tokens (`bg-background`, `text-foreground`, `bg-card`, `border`, `bg-muted`, etc.) — never hardcode hex values in components, so light/dark switching works automatically
- Define the green accent as a CSS variable in `globals.css` with separate values for light and dark themes, adjusted for contrast in each
- Check the existing `globals.css` — if light/dark variable sets are already defined, extend rather than replace them
- Add a **theme toggle** in the app header that cycles between light / dark / system. Use `Sun`, `Moon`, and `Monitor` icons from `lucide-react`. The toggle should persist via `next-themes` (it handles localStorage automatically)

**Light mode considerations:**
- Background: clean off-white or white (`bg-background`)
- Player slots, cards, and inputs use `bg-card` / `border` tokens
- Green accent must meet WCAG AA contrast against light backgrounds
- Red and green reveal states must read clearly on light backgrounds

**Dark mode considerations:**
- Background: near-black from the existing boilerplate dark theme
- Green accent should not appear garish against dark backgrounds
- Ensure sufficient contrast on all interactive elements

### Responsive Layout

The app must be fully usable on both desktop and mobile. Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) throughout — do not build separate mobile/desktop component trees.

#### Desktop layout (md and above)
```
[xi.]              [❤️❤️❤️] [💡💡💡] [⏱ 00:00]  [☀️/🌙/💻]

    MANCHESTER UNITED       vs       BAYERN MUNICH
    UEFA Champions League Final — 26 May 1999
    "The Treble Clincher"

  [HOME XI]                         [AWAY XI]
  1. ________________               1. ________________
  2. ________________               2. ________________
  ...                               ...

              [ type a surname... ]
              [ autocomplete dropdown ]

  Wrong guesses: Giggs, Keane
```
- Two-column lineup layout, side by side
- Input centred below both columns
- Header: logo left, lives/clues/timer centre-right, theme toggle far right

#### Mobile layout (below md)
- Single-column layout — home XI stacked above away XI with a clear team label between them
- Input **sticky to the bottom** of the viewport so the on-screen keyboard doesn't obscure it
- Header: compact — icons only for lives, clues, and timer to save space; theme toggle icon only
- Player slots must have a minimum 44px tap target height (touch-friendly)
- Autocomplete dropdown opens **upward** from the input on mobile to avoid keyboard overlap

### Slot states
- **Empty:** muted placeholder with slot number (`bg-muted` token)
- **Clue revealed:** subtle highlight with clue badge showing the hint (`bg-accent/20` or similar)
- **Correct:** green fill — player name + position + shirt number, animated in
- **Revealed post-game:** green (got it) or red (missed) — both must work clearly in light and dark mode

---

## Routing (App Router)

- `app/page.tsx` — today's game
- `app/stats/page.tsx` — user's personal stats (streak, win rate, games played)
- `app/how-to-play/page.tsx` — rules (also shown as a modal on first visit)
- `app/archive/page.tsx` — stretch goal, skip for v1

---

## How to Play Modal

Show automatically on the user's first visit (check `localStorage` for a `xi_seen_instructions` flag). Also accessible from a `?` button in the header.

Content:
> **How to play xi.**
>
> A famous match is revealed every day. Guess the starting XI for both teams.
>
> - Type a player's **surname** to guess
> - You have **3 lives** — a wrong guess costs one
> - Use **clues** to reveal a hint about an unknown player
> - Get all 22 right to win
>
> Come back tomorrow for a new match.

---

## Component Structure

Keep components modular and colocated under `components/xi/`:

- `MatchHeader` — title, teams, competition, date
- `TeamColumn` — list of 11 `PlayerSlot` components for one team
- `PlayerSlot` — individual slot (empty / clue / correct / revealed)
- `GuessInput` — text input with autocomplete dropdown
- `ClueButton` — use a clue, shows remaining count
- `LivesDisplay` — heart icons showing remaining lives
- `EndScreen` — results summary + match reveal + share card
- `ShareCard` — the emoji grid + copy/download actions
- `HowToPlayModal` — first-visit instructions

Game state (guessed players, lives, clues, wrong guesses, timer) should live in a single `useGameState` hook in `hooks/useGameState.ts`.

---

## Transfermarkt API — Player Photos (Reveal Screen Only)

A self-hosted instance of the Transfermarkt API (felipeall/transfermarkt-api) is available at the following base URL — **store this in an environment variable:**

```
NEXT_PUBLIC_TRANSFERMARKT_API_URL=https://your-vercel-url.vercel.app
```

**This API is used in one place only: the end screen reveal.** Do not call it during active gameplay.

### How to use it

When the end screen is shown and the full lineups are revealed, fetch a photo for each of the 22 players to display alongside their name, position, and shirt number.

**Step 1 — Search for the player by name:**
```
GET {NEXT_PUBLIC_TRANSFERMARKT_API_URL}/players/search/{playerName}
```
Use the player's full name from the match data. Take the first result's `id`.

**Step 2 — Fetch the player profile to get the image URL:**
```
GET {NEXT_PUBLIC_TRANSFERMARKT_API_URL}/players/{playerId}/profile
```
The response includes an `imageUrl` field. Use this as the player's photo `src`.

### Important constraints

- **Non-critical** — if any fetch fails (network error, player not found, API down), fall back gracefully to a generic football avatar placeholder. Never let a failed photo fetch break the reveal screen.
- **Don't block the reveal** — fetch photos in the background after the end screen mounts; show the reveal immediately with placeholders, then swap in photos as they resolve. Use `Promise.allSettled` so one failure doesn't block the rest.
- **No API calls during gameplay** — only trigger these fetches when the game has ended and the end screen is rendered.
- **Rate limiting** — the API has rate limiting enabled in production. Fetching 22 players sequentially may hit limits; batch thoughtfully or accept that some photos may not load.
- **Environment variable** — never hardcode the API base URL. Read it from `process.env.NEXT_PUBLIC_TRANSFERMARKT_API_URL` throughout.

- User auth via Clerk to make UUID portable across devices
- Admin panel to manually assign specific matches to specific dates
- Archive page with past matches and results
- Leaderboard / friends comparison
- Difficulty rating per match (era, obscurity)

---

## Final Checklist Before Submitting

- [ ] Studied the existing boilerplate thoroughly before making changes
- [ ] `cacheComponents: true` set in `next.config.ts`
- [ ] `use cache` applied to today's match fetch, with `cacheTag('daily-match')`
- [ ] Convex schema defined and seed mutation written
- [ ] At least 40 matches seeded with accurate full player data
- [ ] Game fully playable end-to-end (guess → correct/wrong → lives → end screen)
- [ ] Share card generates both copyable text and downloadable image
- [ ] Stats saved to Convex and displayed on `/stats`
- [ ] How to play modal shows on first visit
- [ ] `next-themes` installed and `ThemeProvider` wrapping the app in `layout.tsx`
- [ ] Light, dark, and system colour modes all working correctly
- [ ] Theme toggle in header (sun/moon/monitor icons) persists preference
- [ ] All colours use shadcn CSS variable tokens — no hardcoded hex values in components
- [ ] Green accent defined as a CSS variable with appropriate values for both light and dark themes
- [ ] Desktop two-column layout working correctly at md breakpoint and above
- [ ] Mobile single-column layout working correctly below md breakpoint
- [ ] Input sticky to bottom of viewport on mobile
- [ ] Autocomplete dropdown opens upward on mobile
- [ ] Player slots meet 44px minimum tap target on mobile
- [ ] Transfermarkt API base URL stored in `NEXT_PUBLIC_TRANSFERMARKT_API_URL` env variable
- [ ] Player photos fetched and displayed on end screen reveal, with graceful fallback to avatar placeholder
- [ ] Photo fetches use `Promise.allSettled` and do not block the reveal screen rendering
- [ ] Existing shadcn theme respected and extended, not overridden
