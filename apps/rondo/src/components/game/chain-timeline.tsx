"use client";

import { Shield, Shirt } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import type { ChainLink } from "@/lib/game/types";
import { cn } from "@/lib/utils";


function ChainCard({ link, latest }: { link: ChainLink; latest: boolean }) {
  const isClub = link.kind === "club";
  const image = isClub ? link.badge : link.image;
  const subtitle = isClub ? "Club" : "Player";

  return (
    <div
      className={cn(
        "relative flex w-[8.5rem] shrink-0 flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center shadow-sm transition-all sm:w-40",
        latest ? "border-primary ring-2 ring-primary/40" : "border-border",
      )}
    >
      <span className="absolute top-2 left-2 font-heading text-[0.6rem] tracking-widest text-muted-foreground uppercase">
        {isClub ? "Club" : "Player"}
      </span>
      <div
        className={cn(
          "mt-3 flex size-16 items-center justify-center overflow-hidden bg-muted sm:size-20",
          isClub ? "rounded-md" : "rounded-full",
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={link.name}
            width={80}
            height={80}
            className={cn(
              "size-full",
              isClub ? "object-contain p-1" : "object-cover",
            )}
            unoptimized
          />
        ) : isClub ? (
          <Shield className="size-7 text-muted-foreground" aria-hidden />
        ) : (
          <Shirt className="size-7 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="flex min-h-[2.5rem] flex-col justify-start">
        <span className="line-clamp-2 text-sm leading-tight font-semibold">
          {link.name}
        </span>
        {!isClub && subtitle !== "Player" && (
          <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

/** The chain so far, rendered as connected collectible cards (the "passes"). */
export function ChainTimeline({ chain }: { chain: ChainLink[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the most recent link in view as the chain grows.
  // biome-ignore lint/correctness/useExhaustiveDependencies: chain.length is the intended scroll trigger.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [chain.length]);

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-2"
    >
      {chain.map((link, i) => (
        <div
          key={`${link.kind}-${link.id}`}
          className="flex items-center gap-1"
        >
          {i > 0 && (
            <div className="flex h-px w-6 shrink-0 items-center sm:w-8">
              <div className="h-px w-full bg-gradient-to-r from-border via-primary/60 to-border" />
            </div>
          )}
          <ChainCard link={link} latest={i === chain.length - 1} />
        </div>
      ))}
    </div>
  );
}
