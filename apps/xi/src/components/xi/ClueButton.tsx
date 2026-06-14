"use client";

import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClueButton({
  remaining,
  total,
  onUse,
  disabled,
}: {
  remaining: number;
  total: number;
  onUse: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onUse}
      disabled={disabled || remaining === 0}
      aria-label={`Use a clue, ${remaining} of ${total} remaining`}
      className="gap-1.5 px-2"
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <Lightbulb
            key={i}
            className={cn(
              "size-4 sm:size-5 transition-colors",
              i < remaining
                ? "fill-primary/80 text-primary"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        ))}
      </div>
    </Button>
  );
}
