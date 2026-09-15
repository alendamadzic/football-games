import { Suspense } from "react";
import { AlbumGame } from "@/components/designs/AlbumGame";
import { SetupNotice } from "@/components/xi/SetupNotice";
import { getTodaysMatch } from "@/lib/match";

export default async function HomePage() {
  const match = await getTodaysMatch();
  if (!match) return <SetupNotice />;
  return (
    <Suspense>
      <AlbumGame match={match} />
    </Suspense>
  );
}
