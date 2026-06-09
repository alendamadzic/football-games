import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Wordmark } from "@/components/wordmark";

/** Slim top bar with the wordmark (links home) and the theme toggle. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <Link href="/" aria-label="rondo. home" className="outline-none">
        <Wordmark size="sm" />
      </Link>
      <ThemeToggle />
    </header>
  );
}
