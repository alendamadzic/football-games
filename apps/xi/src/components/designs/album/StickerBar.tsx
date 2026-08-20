"use client";

import { useEffect, useId } from "react";
import { useDockHeight } from "@/hooks/useDockHeight";
import type { GameApi } from "@/hooks/useGameState";
import { useGuessField } from "@/hooks/useGuessField";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CollectedFlash } from "./CollectedFlash";

export function StickerBar({
  match,
  game,
  photos,
}: {
  match: Match;
  game: GameApi;
  photos: Record<string, string>;
}) {
  const { keyboardOpen } = useVisualViewport();
  const dockRef = useDockHeight<HTMLDivElement>();
  const listId = useId();

  // With the keyboard up there is far less room above the input, so show a
  // shorter list rather than stacking six rows into the keyboard.
  const f = useGuessField(game.guess, { limit: keyboardOpen ? 4 : 6 });

  // Focus on load only with a real keyboard — on touch this used to summon the
  // software keyboard on top of the first-visit rules sheet. Read matchMedia
  // directly rather than via useIsTouch: that hook reports `false` on the first
  // client render to match the server, which was long enough to fire the focus.
  const { inputRef } = f;
  useEffect(() => {
    if (window.matchMedia?.("(pointer: coarse)").matches) return;
    inputRef.current?.focus();
  }, [inputRef]);

  const open = f.suggestions.length > 0;

  return (
    <div
      ref={dockRef}
      // Rides above the software keyboard. Chrome/Android resizes the layout
      // for us; iOS Safari does not, so --xi-kb makes up the difference.
      style={{ transform: "translateY(calc(-1 * var(--xi-kb, 0px)))" }}
      className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-[oklch(0.24_0.028_60)] bg-[oklch(0.955_0.02_88)] pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-transform duration-150 motion-reduce:transition-none"
    >
      <div className="mx-auto w-full max-w-md px-3 pt-3 sm:px-5">
        <div className="relative">
          <CollectedFlash
            match={match}
            event={game.lastEvent}
            score={game.score}
            total={game.total}
            photos={photos}
          />

          {open && (
            <div
              // Capped and scrollable — an uncapped list opening upward pushed
              // ~300px straight into the keyboard.
              className="absolute bottom-full mb-2 max-h-[min(40dvh,15rem)] w-full overflow-y-auto overscroll-contain rounded-md border-2 border-[oklch(0.24_0.028_60)] bg-[oklch(0.955_0.02_88)] shadow-[2px_2px_0_oklch(0.24_0.028_60)]"
              id={listId}
              role="listbox"
              aria-label="Player suggestions"
            >
              {f.suggestions.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === f.highlight}
                  // pointerdown, not mousedown: touch only ever got these via
                  // synthesised mouse events.
                  onPointerDown={(e) => {
                    e.preventDefault();
                    f.submit(s);
                  }}
                  onMouseEnter={() => f.setHighlight(i)}
                  className={cn(
                    "flex min-h-11 w-full items-center px-4 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-[oklch(0.24_0.028_60)]",
                    i === f.highlight ? "bg-primary/15" : "hover:bg-black/5",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* A real form, so the keyboard's Go key submits. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              f.submit(f.suggestions[f.highlight] ?? f.value);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md border-2 bg-white pl-4 pr-1.5 transition-colors",
              f.flash === "wrong"
                ? "animate-shake border-destructive bg-destructive/10"
                : f.flash === "correct"
                  ? "border-primary bg-primary/10"
                  : f.flash === "duplicate"
                    ? "border-amber-500 bg-amber-500/10"
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
              inputMode="search"
              enterKeyHint="go"
              aria-label="Guess a player"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                open ? `${listId}-${f.highlight}` : undefined
              }
              // text-base keeps iOS from zooming the page on focus.
              className="h-12 flex-1 bg-transparent text-base text-[oklch(0.24_0.028_60)] outline-none placeholder:text-[oklch(0.5_0.03_60)]"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded bg-[oklch(0.24_0.028_60)] px-4 text-xs font-black uppercase tracking-widest text-[oklch(0.955_0.02_88)] transition-colors hover:bg-primary"
            >
              Stick it
            </button>
          </form>
        </div>

        {game.wrongGuesses.length > 0 && (
          <div
            // One scrolling row on a phone: wrapping chips changed the dock's
            // height mid-game, which shifted the whole page.
            className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible"
          >
            {game.wrongGuesses.slice(-6).map((w, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: the same wrong guess can legitimately repeat
                key={`${w}-${i}`}
                className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold uppercase text-destructive line-through"
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
