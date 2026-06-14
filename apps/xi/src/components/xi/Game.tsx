"use client";

import { useEffect, useState } from "react";
import type { Match } from "@/lib/types";
import { useGameState } from "@/hooks/useGameState";
import { todayUTC } from "@/lib/format";
import { Header } from "./Header";
import { MatchHeader } from "./MatchHeader";
import { TeamColumn } from "./TeamColumn";
import { GuessInput } from "./GuessInput";
import { EndScreen } from "./EndScreen";
import { HowToPlayModal } from "./HowToPlayModal";
import { ResultSync } from "./ResultSync";

const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function Game({ match }: { match: Match }) {
  const persistKey = `xi_game_${match.slug}_${todayUTC()}`;
  const game = useGameState(match, persistKey);
  const [helpOpen, setHelpOpen] = useState(false);

  // Show How-to-Play automatically on the very first visit.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem("xi_seen_instructions")) {
      setHelpOpen(true);
      window.localStorage.setItem("xi_seen_instructions", "1");
    }
  }, []);

  const over = game.status !== "playing";

  return (
    <div className="flex min-h-full flex-col">
      <Header
        lives={game.lives}
        totalLives={game.totalLives}
        seconds={game.seconds}
        onHelp={() => setHelpOpen(true)}
        showGame={!over}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 sm:px-6 pb-32">
        {over ? (
          <EndScreen
            match={match}
            won={game.status === "won"}
            guessed={game.guessed}
            score={game.score}
            lives={game.lives}
            totalLives={game.totalLives}
            seconds={game.seconds}
            isGuessed={game.isGuessed}
          />
        ) : (
          <>
            <MatchHeader match={match} />
            <div className="grid gap-6 md:grid-cols-2">
              <TeamColumn
                team="home"
                teamName={match.homeTeam}
                players={match.homePlayers}
                isGuessed={game.isGuessed}
              />
              <TeamColumn
                team="away"
                teamName={match.awayTeam}
                players={match.awayPlayers}
                isGuessed={game.isGuessed}
              />
            </div>
          </>
        )}
      </main>

      {/* Sticky guess bar — stays above the on-screen keyboard on mobile. */}
      {!over && (
        <div className="sticky bottom-0 z-20 border-t bg-background/90 px-3 sm:px-6 py-3 backdrop-blur">
          <GuessInput
            match={match}
            guessed={game.guessed}
            onGuess={game.guess}
          />
          {game.wrongGuesses.length > 0 && (
            <p className="mx-auto mt-2 max-w-md text-center text-xs text-muted-foreground">
              <span className="font-medium">Wrong:</span>{" "}
              {game.wrongGuesses.join(", ")}
            </p>
          )}
        </div>
      )}

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
