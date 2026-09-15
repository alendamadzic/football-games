import { LocalGame } from "@/components/game/multi/local-game";
import { STARTING_SCORE } from "@/lib/game/engine";

export default async function LocalPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  // Dev-only override so end states can be exercised: /local?start=42
  let startScore = STARTING_SCORE;
  if (process.env.NODE_ENV !== "production") {
    const requested = Number(searchParams.start);
    if (Number.isInteger(requested) && requested > 0 && requested <= 999) {
      startScore = requested;
    }
  }

  return <LocalGame startScore={startScore} />;
}
