import { Suspense } from "react";
import { getTodaysMatch } from "@/lib/match";
import { Game } from "@/components/xi/Game";
import { SetupNotice } from "@/components/xi/SetupNotice";

export default async function HomePage() {
  const match = await getTodaysMatch();

  if (!match) return <SetupNotice />;

  return (
    <Suspense>
      <Game match={match} />
    </Suspense>
  );
}
