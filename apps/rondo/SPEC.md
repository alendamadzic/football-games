# rondo. — Claude Code Build Prompt

## Project Overview

Build **rondo.** — a football knowledge chain game. The name is always written lowercase with a trailing dot.

The core mechanic is a Club → Player → Club → Player chain. A starting club is given, and players take turns: one names a player who played for that club, the next names another club that player played for, and so on. The chain continues until someone is eliminated or gives up.

---

## Before You Write Any Code

**Study the project first.** Before touching any files, thoroughly read the existing project structure:

- Review `package.json` to understand what is already installed — do not add packages that are already present
- Read the existing `tailwind.config.ts` and understand the theme tokens already defined
- Check `components/ui/` to see which shadcn components are already installed — do not reinstall or duplicate them
- Review any existing layout files (`app/layout.tsx`, `app/page.tsx`) to understand what is already in place
- Check for any existing environment variable configuration (`.env.example` or similar)
- Review the Biome config (`biome.json`) to understand the formatting and linting rules in place

Only once you have a clear picture of what exists should you begin building. Work with what is there — extend it, don't replace it.

---

## Technical Stack

This is a pre-configured Next.js project. Do not scaffold or initialise anything — work within the existing setup:

- **Linting & formatting:** Biome — respect the existing `biome.json` config; do not add ESLint or Prettier
- **Framework:** Next.js with App Router and Cached Components
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Component library:** shadcn/ui (theme already configured — use existing shadcn components wherever possible, do not install alternatives)
- **Package manager:** `bun` (never use `npm` or `npx`)
- **Hosting:** Vercel
- **Database:** None required for this phase
- **AI:** The project has AI Skills pre-configured — use them where appropriate (e.g. answer verification, Arcade Mode logic)
- **Football data:** [TheSportsDB](https://www.thesportsdb.com/) free tier API (v1) for clubs, players, and career history data
- **Responsive:** The app must be fully responsive and work equally well on mobile and desktop — no bias toward either

---

## Theme & Visual Design

- The app must support **light mode**, **dark mode**, and **system default**
- System preference is the default
- Include a theme toggle that cycles through: System → Light → Dark
- The name **rondo.** should be treated as a visual identity — always lowercase, always with the trailing dot, used consistently across the UI
- Design should feel like a modern football product — clean, confident, sport-adjacent without being clichéd. Think football culture, not a generic quiz app
- Use shadcn components as the foundation but apply intentional visual personality — typography, spacing, and colour choices should feel distinctive
- Avoid generic defaults: no generic quiz-app pastels, no generic sports-app dark navy + yellow combos unless deliberately justified

---

## Game Rules

### Core Loop
1. A random well-known global football club is chosen to start
2. The current player must name a footballer who has played for that club
3. The next player must name a club that the footballer has also played for
4. Repeat — Club → Player → Club → Player
5. Players alternate turns following this loop

### Rules
- No club or player can be used **more than once** in the same game chain
- Loan spells **count** as playing for a club
- If a player gives a **factually incorrect link** (e.g. names a club the player didn't play for), they are **immediately eliminated**
- Answer verification is done via the TheSportsDB API — if the API cannot confirm or deny, surface a clear UI state to handle this gracefully
- Starting clubs are always **well-known global clubs** (major European clubs, South American giants, etc.) — do not start with obscure lower-league teams

### Input
- Players input answers via an **autocomplete search field** that pulls suggestions from the TheSportsDB API in real time
- The field should be context-aware: when it's a "name a player" turn, suggest players; when it's a "name a club" turn, suggest clubs

---

## Game Modes

### Local Multiplayer
- 2 or more players on the same device, taking turns
- During setup, players enter their names
- The active player's name and turn is clearly shown at all times
- A wrong answer eliminates that player from the game
- The last player remaining wins
- On elimination, show clearly who was eliminated and why

### Arcade Mode
- Single player only
- The player tries to build the longest possible chain before time runs out or they make a wrong answer
- **Score = number of successful links made**
- A countdown timer is shown prominently — the default time limit is **5 minutes**
- On game over, show the player's final score and the full chain they built

---

## Game Setup Options (Pre-game lobby)

Both modes should have a setup screen before the game starts. Configurable options:

| Option | Default | Notes |
|---|---|---|
| Turn timer | 5 minutes | Can be adjusted or disabled. Applied per-turn in Local Multiplayer; applies to the full session in Arcade Mode |
| Lives | 1 (off) | Option to give players 2 or 3 lives before elimination. Local Multiplayer only |
| Player names | — | Required in Local Multiplayer; not needed in Arcade Mode |

---

## Screens & Flow

### Home Screen
- Display the **rondo.** wordmark prominently
- Two clear mode entry points: **Local Multiplayer** and **Arcade Mode**
- Theme toggle accessible from here

### Setup Screen
- Mode-specific configuration (see above)
- Clear "Start Game" CTA

### Game Screen
- The current chain should be visible — show the history of clubs and players used so far
- Clearly indicate whose turn it is and what type of answer is expected ("Name a player" or "Name a club")
- Show the turn timer if enabled
- Autocomplete input is the primary interaction
- In Local Multiplayer, show remaining players and lives (if lives mode is on)
- In Arcade Mode, show current score (chain length) and countdown timer prominently

### Elimination Screen (Local Multiplayer)
- Show who was eliminated
- Show what the wrong answer was and what the correct answer would have been (if determinable from the API)
- Continue to next player's turn or show winner if only one remains

### Game Over Screen
- Local Multiplayer: Show the winner and a summary of the chain
- Arcade Mode: Show final score, chain length, and the full chain built
- Option to play again or return to home

---

## API Integration Notes

### TheSportsDB API
Use the **TheSportsDB v1 free API** (`https://www.thesportsdb.com/api/v1/json/123/`). No registration or API key is required for the free tier — the key `123` is public and embedded in the URL. Read the full documentation at `https://www.thesportsdb.com/documentation` before implementing.

The three core endpoints needed for rondo. are:

| Purpose | Endpoint |
|---|---|
| Search for a club by name (autocomplete) | `searchteams.php?t={query}` |
| Get all players in a team's current squad | `lookup_all_players.php?id={teamId}` |
| Get all former clubs for a player | `lookuphonours.php` / `lookupformerteams.php?id={playerId}` |

Before writing any integration code, verify the exact endpoint names and response shapes against the live documentation, as endpoint naming in the v1 API can be inconsistent.

### General API Guidelines
- **Before implementing any caching, read the latest Next.js caching documentation** at `https://nextjs.org/docs/app/building-your-application/caching` and follow current best practices — do not rely on prior knowledge as caching patterns evolve across Next.js versions
- Never make the same API call twice in a session if the result can be stored — cache verified answers in game state so re-checking the same club or player does not trigger a new API request
- The autocomplete search should be debounced to avoid hammering the API
- Handle API failures gracefully — show a clear message if verification cannot be completed, and give the current player the option to re-enter their answer
- Store used clubs and players in game state (not a database) — this resets when a new game starts
- The free tier has no published rate limit but is a shared public resource — be a good citizen and avoid unnecessary requests

---

## Code Quality & Structure

- Use TypeScript throughout with proper types — no `any`
- **Biome** is the linter and formatter — all code must pass `biome check` without errors. Do not introduce ESLint, Prettier, or any conflicting tooling
- Separate game logic from UI — keep game state management clean and testable
- Use App Router conventions — **prefer React Server Components by default**; only opt into `'use client'` where interactivity genuinely requires it
- **Use Server Actions** for all data mutations and TheSportsDB API calls — do not build a separate API route layer. Server Actions should be the primary mechanism for server-side logic
- **File structure:** Before creating any folders or files, read the latest Next.js documentation on project organisation (`https://nextjs.org/docs/app/getting-started/project-structure`) and follow current best practices for App Router projects
- Game state should live in a well-structured client-side store (React context or similar) — no need for persistence between sessions
- Write clean, readable code with comments where logic is non-obvious

---

## Out of Scope for This Build

- Online multiplayer (planned for a future phase)
- User accounts or authentication
- Persistent leaderboards or saved game history
- Native mobile app
