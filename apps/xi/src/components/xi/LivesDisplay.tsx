"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function LivesDisplay({
  lives,
  total,
}: {
  lives: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={`${lives} lives left`}>
      {Array.from({ length: total }).map((_, i) => (
        <Heart
          key={i}
          className={cn(
            "size-4 sm:size-5 transition-colors",
            i < lives
              ? "fill-destructive text-destructive"
              : "fill-transparent text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}
