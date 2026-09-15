"use client";

import { Button } from "@football/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";

export function SimpleHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 sm:px-6 py-3">
        <Logo />
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to game"
            render={<Link href="/" />}
          >
            <ArrowLeft className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
