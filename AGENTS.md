# football-games

A Turborepo monorepo for three football trivia games and the API they
share.

```
apps/
  checkout/            Football's 501 (darts). Next 16, Convex.        :3000
  rondo/                Club/player chain game. Next 16, Convex.        :3001
  xi/                    Daily starting-XI guesser. Next 16, Convex.     :3002
  transfermarkt-api/    FastAPI scraper all three games call.           :8000
packages/
  ui/                    Shared shadcn (base-sera / Base UI) components.
  transfermarkt/         Shared typed client for apps/transfermarkt-api.
  shared/                Small cross-app utilities (device id, etc).
  typescript-config/     Base tsconfig every package extends.
```

## Commands

Run from the repo root unless noted.

- `bun install` — install everything.
- `bun run dev` — all four apps together (`turbo run dev`), or scope one
  with `bun run dev --filter checkout` (etc).
- `bun run build` / `bun run check-types` — same pattern, all packages.
- `bun run lint` / `bun run format` / `bun run check` — Biome. There is
  **no per-app lint script** — Biome runs only from the root, against the
  whole tree, via the single `biome.json` there.
- `apps/transfermarkt-api` is Python (uv), not Bun: `bun run dev --filter
  transfermarkt-api` still works (it shells out to `uv run uvicorn`), or
  `cd apps/transfermarkt-api && uv run pytest` / `uv run ruff check .`
  directly.

## Shared packages

Prefer extending `packages/ui`, `packages/transfermarkt` or
`packages/shared` over adding a one-off copy in an app. Each app-specific
customization exists because it's genuinely app-specific — check the
component's git history before assuming a divergence is drift rather
than intentional (e.g. xi's local `src/components/ui/dialog.tsx` is a
deliberate mobile bottom-sheet, not a stale copy).

- New shadcn component: `bunx shadcn@latest add <name> -c packages/ui`.
  Every app's `components.json` already points its `ui`/`utils` aliases
  at the package, so `bunx shadcn add <name> -c apps/rondo` also lands
  in `packages/ui`, not the app.
- Transfermarkt API calls go through `@football/transfermarkt`
  (`tmFetch` + typed fetchers). Caching policy (Next `revalidate`,
  `"use cache"`/`cacheLife`) stays in the calling app, not the package.
- `TM_API_URL` is the one env var every app + the shared package reads
  for the Transfermarkt API base URL; it defaults to the shared
  production deployment. Point it at `http://localhost:8000` to run
  against `apps/transfermarkt-api` locally.

## Convex

Each app has its own independent Convex deployment (own schema, own
`convex/` folder) — nothing is shared at that layer. Before editing
`convex/` code in any app, read that app's
`convex/_generated/ai/guidelines.md` first; the root `convex` skill
(`.agents/skills/convex`) covers the same ground.

## This is NOT the Next.js you know

This monorepo's Next.js version has breaking changes from what you may
know — APIs, conventions, and file structure may differ from your
training data. Read the relevant guide in `apps/<name>/node_modules/
next/dist/docs/` before writing any Next.js code, and heed deprecation
notices. Each app's own `AGENTS.md` carries this same notice, regenerated
by `next dev`; keep it when it shows up in a diff.
