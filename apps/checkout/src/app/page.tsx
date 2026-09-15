import Link from "next/link";
import { STARTING_SCORE } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

const MODES = [
  {
    href: "/solo",
    title: "solo",
    scrawl: "the practice board",
    blurb: "You against the board. Name them, count down, land on zero.",
  },
  {
    href: "/local",
    title: "local",
    scrawl: "pass it round",
    blurb:
      "One phone, same table. Take turns — every name thrown is burned for everyone.",
  },
  {
    href: "/online",
    title: "online",
    scrawl: "share a code",
    blurb:
      "Own devices, one board. Four letters gets your mates to the same oche.",
  },
] as const;

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-4 py-12 sm:gap-14">
      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-7xl leading-none tracking-wide sm:text-8xl">
          checkout<span className="text-primary">.</span>
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Football&apos;s {STARTING_SCORE}. Every appearance for the badge
          counts down. Exactly zero wins it.
        </p>
      </header>

      <nav className="grid w-full gap-3 sm:grid-cols-3">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className={cn(
              "group relative flex flex-col gap-2 rounded-lg border bg-card px-5 py-6",
              "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-secondary",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            <span className="font-marker text-xs text-primary/80 transition-colors duration-200 group-hover:text-primary">
              {mode.scrawl}
            </span>
            <span className="font-display text-4xl tracking-wide">
              {mode.title}
              <span className="text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                .
              </span>
            </span>
            <span className="text-sm text-muted-foreground">{mode.blurb}</span>
          </Link>
        ))}
      </nav>

      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        pick your game · game on
      </p>
    </div>
  );
}
