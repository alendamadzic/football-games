"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getUserId } from "@/lib/user-id";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-5 text-center">
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function StatsContent() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => setUserId(getUserId()), []);

  const stats = useQuery(api.stats.getStats, userId ? { userId } : "skip");

  if (userId && stats === undefined) {
    return <p className="text-center text-muted-foreground">Loading…</p>;
  }

  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const gamesWon = stats?.gamesWon ?? 0;
  const winRate =
    gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat label="Played" value={gamesPlayed} />
      <Stat label="Won" value={gamesWon} />
      <Stat label="Win %" value={`${winRate}%`} />
      <Stat label="Current streak" value={stats?.currentStreak ?? 0} />
      <Stat label="Longest streak" value={stats?.longestStreak ?? 0} />
      <Stat
        label="Last played"
        value={stats?.lastPlayedDate ?? "—"}
      />
    </div>
  );
}
