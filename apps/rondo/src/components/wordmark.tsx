import { cn } from "@football/ui/lib/utils";

const SIZES = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl sm:text-7xl",
  xl: "text-7xl sm:text-8xl md:text-9xl",
} as const;

/**
 * The rondo. wordmark — always lowercase, always with the trailing dot, which
 * is rendered in the volt brand colour. Treated as a locked logotype.
 */
export function Wordmark({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-heading lowercase leading-none tracking-tight select-none",
        SIZES[size],
        className,
      )}
    >
      rondo<span className="text-primary">.</span>
    </span>
  );
}
