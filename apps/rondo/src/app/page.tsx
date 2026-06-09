import { ArrowRight, Users, Zap } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Wordmark } from "@/components/wordmark";

function ModeCard({
  href,
  icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 rounded-xl border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
    >
      <span
        className={`flex size-11 items-center justify-center rounded-lg ${accent}`}
      >
        {icon}
      </span>
      <div>
        <h2 className="font-heading text-2xl uppercase">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight
        className="absolute top-6 right-6 size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <section className="pitch-backdrop flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16 text-center sm:py-20">
        <div className="flex flex-col items-center gap-4">
          <Wordmark size="xl" />
          <p className="max-w-md font-heading text-lg tracking-wide text-muted-foreground uppercase sm:text-xl">
            Club · Player · Club · Player
          </p>
          <p className="max-w-lg text-balance text-muted-foreground">
            The football knowledge chain game. Name a player for the club, then
            a club for the player — keep the chain alive without breaking the
            link.
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <ModeCard
            href="/local"
            icon={<Users className="size-5" aria-hidden />}
            title="Local"
            description="2+ players, one device. Take turns and outlast everyone else."
            accent="bg-primary/15 text-primary"
          />
          <ModeCard
            href="/arcade"
            icon={<Zap className="size-5" aria-hidden />}
            title="Arcade"
            description="Solo against the clock. Build the longest chain you can."
            accent="bg-accent text-accent-foreground"
          />
        </div>
      </section>
    </main>
  );
}
