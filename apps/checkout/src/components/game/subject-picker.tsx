"use client";

import Image from "next/image";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STARTING_SCORE } from "@/lib/game/engine";
import {
  SUBJECTS,
  type Subject,
  type SubjectKind,
  subjectCrestUrl,
} from "@/lib/subjects";
import { cn } from "@/lib/utils";

const TIER_LABELS: Record<Subject["tier"], string> = {
  1: "generous board",
  2: "fair game",
  3: "tricky finish",
};

function SubjectCard({
  subject,
  onPick,
}: {
  subject: Subject;
  onPick: (subject: Subject) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(subject)}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-lg border bg-card px-3 py-4",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-secondary",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
      )}
    >
      <Image
        src={subjectCrestUrl(subject)}
        alt=""
        width={48}
        height={48}
        className="size-12 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-110"
      />
      <span className="text-sm font-medium leading-tight">
        {subject.shortName}
      </span>
      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {subject.detail}
      </span>
      <span
        className={cn(
          "rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em]",
          subject.tier === 1 && "bg-bed-green/15 text-bed-green",
          subject.tier === 2 && "bg-primary/10 text-primary",
          subject.tier === 3 && "bg-treble/10 text-treble",
        )}
      >
        {TIER_LABELS[subject.tier]}
      </span>
    </button>
  );
}

export function SubjectPicker({
  onPick,
}: {
  onPick: (subject: Subject) => void;
}) {
  const [kind, setKind] = useState<SubjectKind>("club");
  const subjects = SUBJECTS.filter((subject) => subject.kind === kind);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-6xl leading-none tracking-wide sm:text-7xl">
          checkout<span className="text-primary">.</span>
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Football&apos;s {STARTING_SCORE}. Pick a badge, name players who wore
          it — every appearance counts down. Land on exactly zero. Three wayward
          darts and you&apos;re out.
        </p>
      </header>

      <Tabs
        value={kind}
        onValueChange={(value) => setKind(value as SubjectKind)}
      >
        <TabsList>
          <TabsTrigger value="club">Clubs</TabsTrigger>
          <TabsTrigger value="nation">Nations</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} onPick={onPick} />
        ))}
      </div>

      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        pick a board · game on
      </p>
    </div>
  );
}
