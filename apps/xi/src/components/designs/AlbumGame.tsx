"use client";

import { HelpCircle, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HowToPlayModal } from "@/components/xi/HowToPlayModal";
import { ResultSync } from "@/components/xi/ResultSync";
import { ShareCard } from "@/components/xi/ShareCard";
import { useGameState } from "@/hooks/useGameState";
import { useGuessField } from "@/hooks/useGuessField";
import { formatTime, todayUTC } from "@/lib/format";
import { formationLabel } from "@/lib/formation";
import { nationalityFlag } from "@/lib/nationality";
import { fetchPlayerPhotos } from "@/lib/transfermarkt";
import type { Match, Player } from "@/lib/types";
import { cn } from "@/lib/utils";

const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

// Each team set gets its own ink colour, the way a real album themes its pages.
const HOME_INK = "oklch(0.31 0.092 256)"; // deep navy
const AWAY_INK = "oklch(0.37 0.13 28)"; // burgundy

// Slight per-sticker tilt as it's pressed into the page.
const ROT = ["-5deg", "4deg", "-3deg", "6deg", "-6deg", "3deg", "-4deg"];

const FOIL =
  "bg-[linear-gradient(115deg,transparent,oklch(0.88_0.11_90/.6),oklch(0.9_0.06_200/.45),transparent)]";

export function AlbumGame({ match }: { match: Match }) {
  const persistKey = `xi_game_${match.slug}_${todayUTC()}`;
  const game = useGameState(match, persistKey);
  const over = game.status !== "playing";
  const [helpOpen, setHelpOpen] = useState(false);
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPlayerPhotos([...match.homePlayers, ...match.awayPlayers]).then(
      setPhotos,
    );
  }, [match]);

  // Show the rules once, on the very first visit.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem("xi_seen_instructions")) {
      setHelpOpen(true);
      window.localStorage.setItem("xi_seen_instructions", "1");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[oklch(0.87_0.022_75)] pb-40 dark:bg-[oklch(0.19_0.012_60)]">
      <TopNav onHelp={() => setHelpOpen(true)} />

      <main className="mx-auto w-full max-w-5xl px-2.5 sm:px-6">
        {/* the album page itself — always aged cream paper */}
        <div className="relative overflow-hidden rounded-xl bg-[oklch(0.955_0.02_88)] p-3 text-[oklch(0.24_0.028_60)] shadow-2xl ring-1 ring-black/15 sm:p-5">
          <div className="halftone pointer-events-none absolute inset-0 text-[oklch(0.24_0.028_60)] opacity-[0.05]" />

          <Masthead match={match} game={game} over={over} />

          <div className="relative grid gap-5 md:grid-cols-2">
            <div className="pointer-events-none absolute inset-y-3 left-1/2 hidden w-4 -translate-x-1/2 bg-[linear-gradient(90deg,rgba(0,0,0,.16),transparent_45%,transparent_55%,rgba(0,0,0,.16))] md:block" />
            <TeamPage
              side="home"
              ink={HOME_INK}
              match={match}
              game={game}
              over={over}
              photos={photos}
            />
            <TeamPage
              side="away"
              ink={AWAY_INK}
              match={match}
              game={game}
              over={over}
              photos={photos}
            />
          </div>
        </div>

        {over && (
          <div className="mx-auto mt-6 max-w-md">
            <ShareCard
              match={match}
              guessed={game.guessed}
              score={game.score}
              lives={game.lives}
              totalLives={game.totalLives}
              seconds={game.seconds}
            />
          </div>
        )}
      </main>

      {!over && <StickerBar match={match} game={game} />}

      <HowToPlayModal open={helpOpen} onOpenChange={setHelpOpen} />

      {convexConfigured && (
        <ResultSync
          matchSlug={match.slug}
          status={game.status}
          score={game.score}
          lives={game.lives}
          seconds={game.seconds}
        />
      )}
    </div>
  );
}

/* ---- Top utility nav (on the "desk") ---------------------------------- */

function TopNav({ onHelp }: { onHelp: () => void }) {
  const iconBtn =
    "grid size-9 place-items-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground";
  return (
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-3 py-2.5 sm:px-6">
      <Link
        href="/"
        className="select-none text-xl font-extrabold tracking-tight"
      >
        xi<span className="text-primary">.</span>
      </Link>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="How to play"
          onClick={onHelp}
          className={iconBtn}
        >
          <HelpCircle className="size-5" />
        </button>
      </div>
    </div>
  );
}

/* ---- Album cover masthead --------------------------------------------- */

function Masthead({
  match,
  game,
  over,
}: {
  match: Match;
  game: ReturnType<typeof useGameState>;
  over: boolean;
}) {
  const pct = Math.round((game.score / game.total) * 100);
  const won = game.status === "won";
  const year = match.date.match(/\d{4}/)?.[0] ?? "";

  return (
    <header className="relative mb-5 border-b-4 border-[oklch(0.24_0.028_60)] pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="flex items-center justify-center gap-1.5 text-[0.6rem] font-black uppercase tracking-[0.25em] text-[oklch(0.45_0.04_60)] sm:justify-start">
            <Star className="size-3 fill-current" /> Official Sticker
            Collection · No. {year} <Star className="size-3 fill-current" />
          </p>
          <h1 className="print-offset mt-1.5 font-display text-4xl uppercase leading-[0.85] sm:text-6xl">
            {match.homeTeam}
            <span className="mx-1.5 text-primary">v</span>
            {match.awayTeam}
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[oklch(0.45_0.04_60)]">
            {match.competition}
            {over && (
              <span className="ml-1 text-[oklch(0.24_0.028_60)]">
                · Final {match.score}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm font-semibold italic text-[oklch(0.42_0.06_40)]">
            “{match.title}”
          </p>
        </div>

        <div className="shrink-0 rounded-lg border-2 border-[oklch(0.24_0.028_60)] bg-[oklch(0.92_0.03_88)] px-4 py-2.5 text-center shadow-[2px_2px_0_oklch(0.24_0.028_60)]">
          <p className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-[oklch(0.45_0.04_60)]">
            My Collection
          </p>
          <p className="font-display text-3xl leading-none">
            {game.score}
            <span className="text-[oklch(0.24_0.028_60/.4)]">
              /{game.total}
            </span>
          </p>
          <div className="mx-auto mt-1.5 h-2 w-36 overflow-hidden rounded-full bg-[oklch(0.24_0.028_60/.15)]">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-[oklch(0.4_0.03_60)]">
            <span className="flex gap-0.5" aria-hidden>
              {Array.from({ length: game.totalLives }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-sm leading-none",
                    i < game.lives ? "opacity-100" : "opacity-25 grayscale",
                  )}
                >
                  ⚽
                </span>
              ))}
            </span>
            <span className="text-xs font-bold tabular-nums">
              {formatTime(game.seconds)}
            </span>
          </div>
        </div>
      </div>

      {over && (
        <span
          className={cn(
            "absolute -top-1 right-2 rotate-6 rounded border-2 px-2.5 py-1 font-display text-lg uppercase tracking-wide shadow-sm sm:right-1/3 sm:text-2xl",
            won
              ? "border-primary bg-primary/10 text-primary"
              : "border-destructive bg-destructive/10 text-destructive",
          )}
        >
          {won ? "Complete!" : `Incomplete · ${game.score}/${game.total}`}
        </span>
      )}
    </header>
  );
}

/* ---- A team's set of stickers ----------------------------------------- */

function TeamPage({
  side,
  ink,
  match,
  game,
  over,
  photos,
}: {
  side: "home" | "away";
  ink: string;
  match: Match;
  game: ReturnType<typeof useGameState>;
  over: boolean;
  photos: Record<string, string>;
}) {
  const players = side === "home" ? match.homePlayers : match.awayPlayers;
  const teamName = side === "home" ? match.homeTeam : match.awayTeam;
  const found = players.filter((_, i) => game.isGuessed(side, i)).length;
  const base = side === "home" ? 1 : 12;

  return (
    <section>
      <div
        className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-white shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
        style={{ backgroundColor: ink }}
      >
        <h2 className="truncate font-display text-xl uppercase italic tracking-wide sm:text-2xl">
          {teamName}
        </h2>
        <span className="shrink-0 rounded bg-white/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider tabular-nums">
          {formationLabel(players)} · {found}/{players.length}
        </span>
      </div>
      <p className="mb-2 mt-1 px-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[oklch(0.45_0.04_60)]">
        Stickers Nº {base}–{base + players.length - 1}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {players.map((player, i) => (
          <Sticker
            key={player.number}
            player={player}
            ink={ink}
            catalog={base + i}
            index={i}
            collected={game.isGuessed(side, i)}
            over={over}
            photoUrl={photos[player.name]}
          />
        ))}
      </div>
    </section>
  );
}

/* ---- A single sticker / pocket ---------------------------------------- */

function Sticker({
  player,
  ink,
  catalog,
  index,
  collected,
  over,
  photoUrl,
}: {
  player: Player;
  ink: string;
  catalog: number;
  index: number;
  collected: boolean;
  over: boolean;
  photoUrl?: string;
}) {
  const missing = over && !collected;

  if (collected) {
    return (
      <div
        style={{
          borderColor: ink,
          ["--slap-rot" as string]: ROT[index % ROT.length],
        }}
        className="animate-slap relative flex aspect-[3/4] flex-col overflow-hidden rounded-md border-[3px] bg-white shadow-[2px_3px_0_rgba(0,0,0,0.18)]"
      >
        {/* brand strip */}
        <div
          className="flex h-3.5 items-center justify-center"
          style={{ backgroundColor: ink }}
        >
          <span className="text-[0.45rem] font-black uppercase tracking-[0.3em] text-white/85">
            xi · {catalog}
          </span>
        </div>
        {/* portrait */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden"
          style={{
            background: `linear-gradient(160deg, color-mix(in oklab, ${ink} 22%, white), white)`,
          }}
        >
          <div
            className="halftone absolute inset-0 opacity-[0.14]"
            style={{ color: ink }}
          />
          <span
            className="absolute left-1 top-1 z-10 grid size-5 place-items-center rounded-full text-[0.6rem] font-black text-white shadow"
            style={{ backgroundColor: ink }}
          >
            {player.number}
          </span>
          {player.position === "GK" && (
            <Star className="absolute right-1 top-1 z-10 size-3.5 fill-amber-300 text-amber-500 drop-shadow" />
          )}
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={player.name}
              className="absolute inset-0 h-full w-full object-contain object-center"
            />
          ) : (
            <span className="select-none text-4xl leading-none drop-shadow-sm sm:text-[2.75rem]">
              {nationalityFlag(player.nationality)}
            </span>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-transparent" />
        </div>
        {/* name banner */}
        <div className="px-1 py-1 text-center" style={{ backgroundColor: ink }}>
          <p className="truncate text-[0.7rem] font-extrabold uppercase leading-tight text-white">
            {player.name}
          </p>
          <p className="text-[0.5rem] font-semibold uppercase tracking-wider text-white/70">
            {player.position}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed shadow-inner",
        missing
          ? "border-destructive/50 bg-destructive/[0.06]"
          : "border-[oklch(0.24_0.028_60/.3)] bg-[oklch(0.9_0.035_85)]",
      )}
    >
      <span
        className={cn(
          "absolute left-1.5 top-1 text-[0.55rem] font-bold",
          missing ? "text-destructive/70" : "text-[oklch(0.4_0.03_60/.65)]",
        )}
      >
        Nº {catalog}
      </span>

      {!missing && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={cn("animate-shine absolute inset-y-0 -left-1/2 w-2/3", FOIL)}
            style={{ animationDelay: `${(index % 5) * 0.5}s` }}
          />
        </div>
      )}

      <span
        className={cn(
          "font-display text-5xl leading-none",
          missing
            ? "text-destructive/20"
            : "text-[oklch(0.24_0.028_60/.13)]",
        )}
      >
        {player.number}
      </span>

      {missing ? (
        <p className="mt-1 max-w-full truncate px-1 text-center text-[0.6rem] font-bold uppercase text-destructive/90">
          {player.name}
        </p>
      ) : (
        <span className="mt-1 text-[0.6rem] font-bold uppercase tracking-widest text-[oklch(0.24_0.028_60/.3)]">
          {player.position}
        </span>
      )}

      <span
        className={cn(
          "absolute inset-x-0 bottom-1 text-center text-[0.5rem] font-black uppercase tracking-[0.2em]",
          missing ? "text-destructive/70" : "text-[oklch(0.24_0.028_60/.3)]",
        )}
      >
        {missing ? "Missing!" : "Needed"}
      </span>
    </div>
  );
}

/* ---- Guess bar (a sticker packet) ------------------------------------- */

function StickerBar({
  match,
  game,
}: {
  match: Match;
  game: ReturnType<typeof useGameState>;
}) {
  const f = useGuessField(match, game.guessed, game.guess);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-[oklch(0.24_0.028_60)] bg-[oklch(0.955_0.02_88)]">
      <div className="mx-auto w-full max-w-md px-3 py-3 sm:px-5">
        <div className="relative">
          {f.suggestions.length > 0 && (
            <ul className="absolute bottom-full mb-2 w-full overflow-hidden rounded-md border-2 border-[oklch(0.24_0.028_60)] bg-[oklch(0.955_0.02_88)] shadow-[2px_2px_0_oklch(0.24_0.028_60)]">
              {f.suggestions.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      f.submit(s);
                    }}
                    onMouseEnter={() => f.setHighlight(i)}
                    className={cn(
                      "flex w-full items-center px-4 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-[oklch(0.24_0.028_60)]",
                      i === f.highlight ? "bg-primary/15" : "hover:bg-black/5",
                    )}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div
            className={cn(
              "flex items-center gap-2 rounded-md border-2 bg-white pl-4 pr-1.5 transition-colors",
              f.flash === "wrong"
                ? "animate-shake border-destructive bg-destructive/10"
                : f.flash === "correct"
                  ? "border-primary bg-primary/10"
                  : "border-[oklch(0.24_0.028_60)]",
            )}
          >
            <input
              ref={f.inputRef}
              value={f.value}
              onChange={(e) => f.setValue(e.target.value)}
              onKeyDown={f.onKeyDown}
              placeholder="Got him? Type a player…"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              // biome-ignore lint/a11y/noAutofocus: primary action of the game
              autoFocus
              className="h-11 flex-1 bg-transparent text-base text-[oklch(0.24_0.028_60)] outline-none placeholder:text-[oklch(0.5_0.03_60)]"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                f.submit(f.suggestions[f.highlight] ?? f.value);
              }}
              className="h-8 shrink-0 rounded bg-[oklch(0.24_0.028_60)] px-4 text-xs font-black uppercase tracking-widest text-[oklch(0.955_0.02_88)] transition-colors hover:bg-primary"
            >
              Stick it
            </button>
          </div>
        </div>
        {game.wrongGuesses.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {game.wrongGuesses.slice(-6).map((w, i) => (
              <span
                key={`${w}-${i}`}
                className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold uppercase text-destructive line-through"
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
