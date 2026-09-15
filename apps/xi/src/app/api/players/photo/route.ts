import { type NextRequest, NextResponse } from "next/server";

const BASE =
  process.env.TM_API_URL ?? "https://transfermarkt-api-xi.vercel.app";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const name = searchParams.get("name");

  try {
    let playerId = id;

    if (!playerId) {
      if (!name) return NextResponse.json({ imageUrl: null });
      const searchRes = await fetch(
        `${BASE}/players/search/${encodeURIComponent(name)}`,
        { next: { revalidate: 86400 } },
      );
      if (!searchRes.ok) return NextResponse.json({ imageUrl: null });
      const search = (await searchRes.json()) as {
        results?: { id: string }[];
      };
      playerId = search.results?.[0]?.id ?? null;
      if (!playerId) return NextResponse.json({ imageUrl: null });
    }

    const profileRes = await fetch(`${BASE}/players/${playerId}/profile`, {
      next: { revalidate: 86400 },
    });
    if (!profileRes.ok) return NextResponse.json({ imageUrl: null });
    const profile = (await profileRes.json()) as { imageUrl?: string };
    return NextResponse.json({ imageUrl: profile.imageUrl ?? null });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
