import type { TurnKind } from "@/lib/game/types";

export function TurnBanner({
  turnKind,
  referenceName,
  activePlayerName,
}: {
  turnKind: TurnKind;
  referenceName: string;
  /** Local multiplayer only — whose turn it is. */
  activePlayerName?: string;
}) {
  return (
    <div className="text-center">
      {activePlayerName && (
        <p className="mb-1 font-heading text-sm tracking-widest text-primary uppercase">
          {activePlayerName}&rsquo;s turn
        </p>
      )}
      <h2 className="font-heading text-3xl leading-none uppercase sm:text-4xl">
        Name a {turnKind === "player" ? "player" : "club"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        {turnKind === "player" ? (
          <>
            who has played for{" "}
            <span className="font-semibold text-foreground">
              {referenceName}
            </span>
          </>
        ) : (
          <>
            that{" "}
            <span className="font-semibold text-foreground">
              {referenceName}
            </span>{" "}
            has played for
          </>
        )}
      </p>
    </div>
  );
}
