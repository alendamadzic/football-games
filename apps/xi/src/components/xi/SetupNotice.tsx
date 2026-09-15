import { Logo } from "./Logo";

// Shown before Convex is connected / seeded so the app renders something useful.
export function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <Logo className="text-4xl" />
      <h1 className="text-xl font-bold">Almost there</h1>
      <p className="text-sm text-muted-foreground">
        No match is available yet. Connect Convex and seed the dataset:
      </p>
      <pre className="w-full overflow-x-auto rounded-lg border bg-muted/50 p-4 text-left text-xs">
        <code>{`bunx convex dev
bunx convex run seed:seedMatches`}</code>
      </pre>
      <p className="text-xs text-muted-foreground">
        Then refresh — today&apos;s match will appear.
      </p>
    </div>
  );
}
