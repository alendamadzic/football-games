// Player photos for the end-screen reveal ONLY. Never called during gameplay.
// Every call fails soft — a missing photo must never break the reveal.

const BASE = process.env.NEXT_PUBLIC_TRANSFERMARKT_API_URL;

async function fetchPhoto(playerName: string): Promise<string | null> {
  if (!BASE) return null;
  try {
    const searchRes = await fetch(
      `${BASE}/players/search/${encodeURIComponent(playerName)}`,
    );
    if (!searchRes.ok) return null;
    const search = (await searchRes.json()) as {
      results?: { id: string }[];
    };
    const id = search.results?.[0]?.id;
    if (!id) return null;

    const profileRes = await fetch(`${BASE}/players/${id}/profile`);
    if (!profileRes.ok) return null;
    const profile = (await profileRes.json()) as { imageUrl?: string };
    return profile.imageUrl ?? null;
  } catch {
    return null;
  }
}

// Fetch many photos without letting one failure block the rest. Resolves to a
// map of playerName -> imageUrl for those that succeeded.
export async function fetchPlayerPhotos(
  names: string[],
): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    names.map(async (name) => ({ name, url: await fetchPhoto(name) })),
  );
  const map: Record<string, string> = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.url) {
      map[r.value.name] = r.value.url;
    }
  }
  return map;
}
