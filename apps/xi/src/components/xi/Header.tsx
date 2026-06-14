"use client";

import { HelpCircle, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { LivesDisplay } from "./LivesDisplay";
import { Timer } from "./Timer";
import { ThemeToggle } from "./ThemeToggle";

export function Header({
  lives,
  totalLives,
  seconds,
  onHelp,
  showGame = true,
}: {
  lives: number;
  totalLives: number;
  seconds: number;
  onHelp: () => void;
  showGame?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 sm:px-6 py-3">
        <Logo />

        {showGame && (
          <div className="flex items-center gap-3 sm:gap-5">
            <LivesDisplay lives={lives} total={totalLives} />
            <Timer seconds={seconds} />
          </div>
        )}

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Stats"
            render={<Link href="/stats" />}
          >
            <BarChart3 className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="How to play"
            onClick={onHelp}
          >
            <HelpCircle className="size-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
