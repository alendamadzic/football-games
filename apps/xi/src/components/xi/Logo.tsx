import Link from "next/link";
import { cn } from "@/lib/utils";

// The brand "xi." — the full stop is a deliberate design element (in primary).
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-bold tracking-tight text-2xl sm:text-3xl leading-none select-none",
        className,
      )}
    >
      xi<span className="text-primary">.</span>
    </Link>
  );
}
