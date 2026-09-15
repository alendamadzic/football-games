export function ScoreBoard({ score }: { score: number }) {
  return (
    <div className="flex items-baseline gap-3 rounded-lg border bg-card px-4 py-2 tabular shadow-sm">
      <span className="font-heading text-xs tracking-widest text-muted-foreground uppercase">
        Links
      </span>
      <span className="font-heading text-3xl leading-none text-primary tabular sm:text-4xl">
        {score}
      </span>
    </div>
  );
}
