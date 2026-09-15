import { Game } from "@/components/game/game";
import { STARTING_SCORE } from "@/lib/game/engine";

export default async function SoloPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  // Dev-only override so exact-checkout and end states can be exercised: /solo?start=42
  let initialScore = STARTING_SCORE;
  if (process.env.NODE_ENV !== "production") {
    const requested = Number(searchParams.start);
    if (Number.isInteger(requested) && requested > 0 && requested <= 999) {
      initialScore = requested;
    }
  }

  return <Game initialScore={initialScore} />;
}
