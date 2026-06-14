"use client";

import type { Player } from "@/lib/types";
import { PlayerSlot } from "./PlayerSlot";

export function TeamColumn({
  team,
  teamName,
  players,
  isGuessed,
  revealed,
}: {
  team: "home" | "away";
  teamName: string;
  players: Player[];
  isGuessed: (team: "home" | "away", index: number) => boolean;
  revealed?: boolean;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-center md:text-left text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {teamName}
      </h2>
      <div className="space-y-1.5">
        {players.map((player, i) => (
          <PlayerSlot
            key={i}
            player={player}
            guessed={isGuessed(team, i)}
            revealed={revealed}
          />
        ))}
      </div>
    </div>
  );
}
