// Player photos for the end-screen reveal ONLY. Never called during gameplay.
// Every call fails soft — a missing photo must never break the reveal.

import type { Player } from "./types";

async function fetchPhoto(player: Player): Promise<string | null> {
  try {
    const param = player.transfermarktId
      ? `id=${encodeURIComponent(player.transfermarktId)}`
      : `name=${encodeURIComponent(player.name)}`;
    const res = await fetch(`/api/players/photo?${param}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { imageUrl: string | null };
    return data.imageUrl ?? null;
  } catch {
    return null;
  }
}

// Fetch many photos without letting one failure block the rest. Resolves to a
// map of playerName -> imageUrl for those that succeeded.
export async function fetchPlayerPhotos(
  players: Player[],
): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    players.map(async (player) => ({
      name: player.name,
      url: await fetchPhoto(player),
    })),
  );
  const map: Record<string, string> = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.url) {
      map[r.value.name] = r.value.url;
    }
  }
  return map;
}
