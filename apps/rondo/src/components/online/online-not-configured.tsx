import { Terminal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Shown when NEXT_PUBLIC_CONVEX_URL is missing. Online mode needs a linked
 * Convex deployment; local/arcade keep working without one.
 */
export function OnlineNotConfigured() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Terminal className="size-6" aria-hidden />
      </span>
      <h1 className="font-heading text-3xl uppercase">
        Online isn’t set up yet
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Online multiplayer needs a Convex backend. Run{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          bunx convex dev
        </code>{" "}
        once to link the project, then restart the dev server.
      </p>
      <Button
        className="mt-6"
        variant="outline"
        nativeButton={false}
        render={<Link href="/" />}
      >
        Back home
      </Button>
    </div>
  );
}
