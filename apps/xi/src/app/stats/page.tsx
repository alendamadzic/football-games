import { SimpleHeader } from "@/components/xi/SimpleHeader";
import { StatsContent } from "@/components/xi/StatsContent";

const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export const metadata = {
  title: "Your stats — xi.",
};

export default function StatsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SimpleHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Your stats</h1>
        {convexConfigured ? (
          <StatsContent />
        ) : (
          <p className="text-sm text-muted-foreground">
            Stats appear once Convex is connected.
          </p>
        )}
      </main>
    </div>
  );
}
