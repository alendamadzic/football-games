import Link from "next/link";

export function OnlineNotConfigured() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="font-display text-5xl leading-none tracking-wide">
        board&apos;s dark<span className="text-primary">.</span>
      </h1>
      <p className="text-balance text-muted-foreground">
        Online play needs a Convex backend. Run{" "}
        <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-sm">
          bunx convex dev
        </code>{" "}
        to link one, then restart the dev server.
      </p>
      <Link
        href="/"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        back to the oche
      </Link>
    </div>
  );
}
