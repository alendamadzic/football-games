"use client";

import type { Match } from "@/lib/types";
import { TeamColumn } from "./TeamColumn";
import { ShareCard } from "./ShareCard";
import { formatTime } from "@/lib/format";

export function EndScreen({
  match,
  won,
  guessed,
  score,
  lives,
  totalLives,
  seconds,
  isGuessed,
}: {
  match: Match;
  won: boolean;
  guessed: Set<string>;
  score: number;
  lives: number;
  totalLives: number;
  seconds: number;
  isGuessed: (team: "home" | "away", index: number) => boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-6">
      {/* Results summary */}
      <div className="text-center space-y-2">
        <p className="text-4xl">{won ? "🏆" : "💔"}</p>
        <h2 className="text-2xl font-bold">
          {won ? "You got the full XI!" : "Out of lives"}
        </h2>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>⚽ {score}/22 players</span>
          <span>❤️ {lives}/{totalLives} lives</span>
          <span>⏱️ {formatTime(seconds)}</span>
        </div>
      </div>

      {/* Match reveal card */}
      <div className="rounded-xl border bg-card p-5 text-center space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {match.competition} — {match.date}
        </p>
        <p className="text-2xl font-bold">
          {match.homeTeam} {match.score} {match.awayTeam}
        </p>
        <p className="text-sm text-muted-foreground">{match.scorers}</p>
      </div>

      {/* Full lineups revealed */}
      <div className="grid gap-6 md:grid-cols-2">
        <TeamColumn
          team="home"
          teamName={match.homeTeam}
          players={match.homePlayers}
          isGuessed={isGuessed}
          revealed
        />
        <TeamColumn
          team="away"
          teamName={match.awayTeam}
          players={match.awayPlayers}
          isGuessed={isGuessed}
          revealed
        />
      </div>

      {/* Share */}
      <ShareCard
        match={match}
        guessed={guessed}
        score={score}
        lives={lives}
        totalLives={totalLives}
        seconds={seconds}
      />
    </div>
  );
}
