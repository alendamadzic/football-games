import type { Match } from "@/lib/types";

// Static match display — safe to cache. Shows competition, teams, and title.
export function MatchHeader({ match }: { match: Match }) {
  return (
    <div className="text-center space-y-1.5 py-4">
      <p className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground">
        {match.competition} — {match.date}
      </p>
      <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
        {match.homeTeam}{" "}
        <span className="text-muted-foreground font-normal">vs</span>{" "}
        {match.awayTeam}
      </h1>
      <p className="text-sm sm:text-base text-primary font-medium italic">
        “{match.title}”
      </p>
    </div>
  );
}
