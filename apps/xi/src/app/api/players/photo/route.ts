import { getPlayerProfile, searchPlayers } from "@football/transfermarkt";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const name = searchParams.get("name");

  try {
    let playerId = id;

    if (!playerId) {
      if (!name) return NextResponse.json({ imageUrl: null });
      const search = await searchPlayers(name, {
        init: { next: { revalidate: 86400 } },
      });
      playerId = search.results?.[0]?.id ?? null;
      if (!playerId) return NextResponse.json({ imageUrl: null });
    }

    const profile = await getPlayerProfile(playerId, {
      init: { next: { revalidate: 86400 } },
    });
    return NextResponse.json({ imageUrl: profile.imageUrl ?? null });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
