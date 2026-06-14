"use client";

import { Timer as TimerIcon } from "lucide-react";
import { formatTime } from "@/lib/format";

export function Timer({ seconds }: { seconds: number }) {
  return (
    <div className="flex items-center gap-1.5 tabular-nums text-sm sm:text-base font-medium">
      <TimerIcon className="size-4 sm:size-5 text-muted-foreground" />
      <span>{formatTime(seconds)}</span>
    </div>
  );
}
