import { type NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_TRANSFERMARKT_API_URL;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }
  if (!BASE) {
    return NextResponse.json({ results: [] });
  }
  try {
    const res = await fetch(
      `${BASE}/players/search/${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [] });
  }
}
