"use client";

import { Button } from "@football/ui/components/button";
import { cn } from "@football/ui/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { Masthead } from "@/components/designs/album/Masthead";
import { StickerBar } from "@/components/designs/album/StickerBar";
import { StickyHud } from "@/components/designs/album/StickyHud";
import {
  AWAY_INK,
  HOME_INK,
  resolvePlayer,
  type Side,
  scrollStickerIntoBand,
} from "@/components/designs/album/shared";
import { TeamPage } from "@/components/designs/album/TeamPage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HowToPlayModal } from "@/components/xi/HowToPlayModal";
import { ResultSync } from "@/components/xi/ResultSync";
import { ShareCard } from "@/components/xi/ShareCard";
import { useGameState } from "@/hooks/useGameState";
import { useIsDesktop, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { todayUTC } from "@/lib/format";
import { fetchPlayerPhotos } from "@/lib/transfermarkt";
import type { Match } from "@/lib/types";

const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function AlbumGame({ match }: { match: Match }) {
  const persistKey = `xi_game_${match.slug}_${todayUTC()}`;
  const game = useGameState(match, persistKey);
  const over = game.status !== "playing";
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [photos, setPhotos] = useState<Record<string, string>>({});

  const isDesktop = useIsDesktop();
  const reducedMotion = usePrefersReducedMotion();
  // Below md only one team's stickers are open at a time — 22 cells is a very
  // long scroll on a phone with the keyboard up. Both sides sit side by side
  // and stay open from md.
  const [openSide, setOpenSide] = useState<Side>("home");
  const collapsible = !isDesktop && !over;

  const stickerRefs = useRef(new Map<string, HTMLDivElement>());
  const registerSticker = useCallback(
    (key: string, el: HTMLDivElement | null) => {
      if (el) stickerRefs.current.set(key, el);
      else stickerRefs.current.delete(key);
    },
    [],
  );

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

  // Bring a newly collected sticker into view: open its team first, then scroll
  // on the next frame once the panel has started expanding.
  const event = game.lastEvent;
  useEffect(() => {
    if (event?.kind !== "correct") return;
    const key = event.keys[0];
    if (!key) return;
    const side = key.split("-")[0];
    if (side === "home" || side === "away") setOpenSide(side);

    const frame = requestAnimationFrame(() => {
      const el = stickerRefs.current.get(key);
      if (el) scrollStickerIntoBand(el, { reducedMotion });
    });
    return () => cancelAnimationFrame(frame);
  }, [event, reducedMotion]);

  return (
    <div
      className={cn(
        "min-h-dvh bg-[oklch(0.87_0.022_75)] dark:bg-[oklch(0.19_0.012_60)]",
        // Reserve exactly the dock's measured height while it's on screen, and
        // nothing once the game ends and it unmounts.
        over ? "pb-10" : "pb-[calc(var(--xi-dock-h,9rem)+1rem)]",
      )}
    >
      <StickyHud
        game={game}
        over={over}
        onHelp={() => setHelpOpen(true)}
        onGiveUp={() => setConfirmOpen(true)}
      />

      <main className="mx-auto w-full max-w-5xl px-3 pt-3 sm:px-6 sm:pt-4">
        {/* the album page itself — always aged cream paper */}
        <div className="relative overflow-hidden rounded-xl bg-[oklch(0.955_0.02_88)] p-2 text-[oklch(0.24_0.028_60)] shadow-2xl ring-1 ring-black/15 sm:p-5">
          <div className="halftone pointer-events-none absolute inset-0 text-[oklch(0.24_0.028_60)] opacity-[0.05]" />

          <Masthead match={match} game={game} over={over} />

          <div className="relative grid gap-3 md:grid-cols-2 md:gap-5">
            <div className="pointer-events-none absolute inset-y-3 left-1/2 hidden w-4 -translate-x-1/2 bg-[linear-gradient(90deg,rgba(0,0,0,.16),transparent_45%,transparent_55%,rgba(0,0,0,.16))] md:block" />
            <TeamPage
              side="home"
              ink={HOME_INK}
              match={match}
              game={game}
              over={over}
              photos={photos}
              collapsible={collapsible}
              open={!collapsible || openSide === "home"}
              onToggle={() => setOpenSide("home")}
              registerSticker={registerSticker}
            />
            <TeamPage
              side="away"
              ink={AWAY_INK}
              match={match}
              game={game}
              over={over}
              photos={photos}
              collapsible={collapsible}
              open={!collapsible || openSide === "away"}
              onToggle={() => setOpenSide("away")}
              registerSticker={registerSticker}
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

      {!over && <StickerBar match={match} game={game} photos={photos} />}

      <GuessAnnouncer match={match} game={game} />

      <HowToPlayModal open={helpOpen} onOpenChange={setHelpOpen} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Give up?</DialogTitle>
            <DialogDescription>
              This ends today&apos;s game and reveals every player, guessed or
              not. You can&apos;t undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                game.giveUp();
              }}
            >
              Give up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

/* ---- Screen-reader feedback ------------------------------------------- */

// The visual feedback (input flash, reveal card, sticker slap) is all silent.
// This is the same information as speech.
function GuessAnnouncer({
  match,
  game,
}: {
  match: Match;
  game: ReturnType<typeof useGameState>;
}) {
  const event = game.lastEvent;
  let message = "";

  if (event?.kind === "correct") {
    const names = event.keys
      .map((k) => resolvePlayer(match, k))
      .filter((p) => p !== null)
      .map((p) => `${p.player.name}, number ${p.player.number}, ${p.teamName}`)
      .join(". ");
    message = `Correct. ${names}. ${game.score} of ${game.total} collected.`;
  } else if (event?.kind === "duplicate") {
    message = `${event.guess} is already in your collection.`;
  } else if (event?.kind === "wrong") {
    message =
      game.lives > 0
        ? `${event.guess} is not in these line-ups. ${game.lives} ${
            game.lives === 1 ? "life" : "lives"
          } left.`
        : `${event.guess} is not in these line-ups. No lives left — game over.`;
  }

  return (
    <output aria-live="polite" className="sr-only">
      {message}
    </output>
  );
}
