import { cn } from "@football/ui/lib/utils";
import { Timer } from "lucide-react";

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Presentational countdown display. `remaining`/`total` are in seconds. */
export function TimerBar({
  remaining,
  total,
  label,
}: {
  remaining: number;
  total: number;
  label?: string;
}) {
  const pct = total > 0 ? Math.max(0, (remaining / total) * 100) : 0;
  const low = remaining <= 10;
  const mid = !low && remaining <= 30;

  return (
    <div className="w-full max-w-xs">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-heading text-xs tracking-widest text-muted-foreground uppercase">
          <Timer className="size-3.5" aria-hidden />
          {label ?? "Time"}
        </span>
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular",
            low
              ? "text-destructive"
              : mid
                ? "text-foreground"
                : "text-foreground",
          )}
        >
          {format(remaining)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 ease-linear",
            low ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
