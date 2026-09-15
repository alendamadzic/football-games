---
name: verify
description: Build, run, and drive the checkout. app to verify changes at the UI surface.
---

# Verifying checkout.

Single-page Next.js 16 app (bun). The whole game is client state under
`src/components/game/`; the only server pieces are the server actions in
`src/lib/tm/actions.ts` that hit the Transfermarkt API.

## Launch

```bash
bun install
TM_API_URL=http://localhost:4100 bun run dev   # port 3000
```

`TM_API_URL` (see `src/lib/tm/client.ts`) lets you point the app at a local
mock so guesses resolve to deterministic appearance counts — essential for
exercising exact score paths (e.g. a player with exactly 180 apps). Serve
these routes with any local server:

- `/players/search/{q}` → `{ results: [{ id, name, position }] }`
- `/players/{id}/stats` → `{ id, stats: [{ competitionId, competitionName, seasonId, clubId, appearances }] }`
  — `clubId` must match a subject id from `src/lib/subjects.ts` ("418" = Real Madrid)
- `/players/{id}/profile` → `{ id, name }`

## Drive (Playwright)

Chromium executable: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
(the `/opt/pw-browsers/chromium` symlink path does not exist; pass
`executablePath` with `playwright-core`).

- Guess flow: fill `getByPlaceholder(/Name .* player/)`, click the
  `[cmdk-item]` for the player, then wait until the `p[aria-live]` caller
  line no longer contains "VAR" (server action in flight).
- `/?start=N` (dev only) overrides the starting score — use it to reach
  checkout/end states quickly.
- End overlays appear after a delay (1300ms win / 800ms loss).
- Already-guessed players are disabled in the dropdown with an
  uppercase-via-CSS "on the sheet" tag — match case-insensitively.

## Gotchas

- External images (club crests, player photos) are proxy-blocked in remote
  sessions and render as broken boxes; not a regression.
- `pkill -f <script>` matches the harness shell's own command line and kills
  it — kill background servers by port instead: `kill $(lsof -ti :4100)`.
