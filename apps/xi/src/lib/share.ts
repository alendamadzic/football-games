import type { Match } from "./types";
import { formatTime } from "./format";

export interface ShareData {
  match: Match;
  guessed: Set<string>;
  score: number;
  lives: number;
  totalLives: number;
  seconds: number;
}

function rowFor(
  team: "home" | "away",
  count: number,
  guessed: Set<string>,
): string {
  let row = "";
  for (let i = 0; i < count; i++) {
    row += guessed.has(`${team}-${i}`) ? "🟩" : "🟥";
  }
  return row;
}

export function buildShareText(data: ShareData): string {
  const { match, guessed, score, lives, totalLives, seconds } = data;
  const home = rowFor("home", match.homePlayers.length, guessed);
  const away = rowFor("away", match.awayPlayers.length, guessed);
  return [
    `xi. — ${match.title}`,
    `⚽ ${score}/22 | ❤️ ${lives}/${totalLives} | ⏱️ ${formatTime(seconds)}`,
    home,
    away,
    "",
    "play at xi.",
  ].join("\n");
}
