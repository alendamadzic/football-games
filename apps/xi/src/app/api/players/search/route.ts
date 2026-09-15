import { searchPlayers } from "@football/transfermarkt";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }
  try {
    const data = await searchPlayers(query, {
      init: { next: { revalidate: 3600 } },
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [] });
  }
}
