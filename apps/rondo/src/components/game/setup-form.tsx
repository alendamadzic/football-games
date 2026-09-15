"use client";

import { Button } from "@football/ui/components/button";
import { Input } from "@football/ui/components/input";
import { Label } from "@football/ui/components/label";
import { Loader2, Play, Plus, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import {
  MAJOR_NATION_NAMES,
  RESTRICTED_POSITIONS,
} from "@/lib/game/difficulty";
import type { GameConfig } from "@/lib/game/types";
import { useGame } from "./game-provider";

const MAX_PLAYERS = 8;

const LOCAL_TIMER_OPTIONS = [
  { label: "Off", value: null },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "2m", value: 120 },
  { label: "5m", value: 300 },
  { label: "Dynamic", value: "dynamic" as const },
] as const;

const ARCADE_TIMER_OPTIONS = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
  { label: "Dynamic", value: "dynamic" as const },
] as const;

const LIVES_OPTIONS = [1, 2, 3] as const;

function Segmented<T extends string | number | boolean | null>({
  options,
  value,
  onChange,
}: {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Button
            key={String(opt.value)}
            type="button"
            aria-pressed={selected}
            variant={selected ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

export function SetupForm() {
  const { mode, startGame, starting, startError } = useGame();
  const isArcade = mode === "arcade";

  const [names, setNames] = useState<string[]>(["", ""]);
  const [lives, setLives] = useState<number>(1);
  const [turnSeconds, setTurnSeconds] = useState<number | "dynamic" | null>(60);
  const [nationalityEnabled, setNationalityEnabled] = useState(false);
  const [positionEnabled, setPositionEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateName(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function addPlayer() {
    setNames((prev) => (prev.length < MAX_PLAYERS ? [...prev, ""] : prev));
  }

  function removePlayer(index: number) {
    setNames((prev) =>
      prev.length > 2 ? prev.filter((_, i) => i !== index) : prev,
    );
  }

  function handleStart() {
    setError(null);
    let config: GameConfig;

    const restrictions = {
      nationality: nationalityEnabled
        ? (MAJOR_NATION_NAMES[
            Math.floor(Math.random() * MAJOR_NATION_NAMES.length)
          ] ?? null)
        : null,
      position: positionEnabled
        ? (RESTRICTED_POSITIONS[
            Math.floor(Math.random() * RESTRICTED_POSITIONS.length)
          ] ?? null)
        : null,
    };

    if (isArcade) {
      config = {
        mode: "arcade",
        turnSeconds,
        lives: 1,
        playerNames: ["You"],
        restrictions,
      };
    } else {
      const cleaned = names.map((n) => n.trim()).filter(Boolean);
      if (cleaned.length < 2) {
        setError("Enter at least two player names to start.");
        return;
      }
      config = {
        mode: "local",
        turnSeconds,
        lives,
        playerNames: cleaned,
        restrictions,
      };
    }
    void startGame(config);
  }

  const timerOptions = isArcade ? ARCADE_TIMER_OPTIONS : LOCAL_TIMER_OPTIONS;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <p className="font-heading text-sm tracking-widest text-primary uppercase">
          {isArcade ? "Arcade Mode" : "Local Multiplayer"}
        </p>
        <h1 className="mt-1 font-heading text-4xl uppercase sm:text-5xl">
          Match setup
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isArcade
            ? "Build the longest chain you can before the clock runs out."
            : "Take turns on one device. A wrong link costs a life — last one standing wins."}
        </p>
      </div>

      <div className="flex flex-col gap-8 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
        {!isArcade && (
          <section className="flex flex-col gap-3">
            <Label className="font-heading text-xs tracking-widest uppercase">
              Players
            </Label>
            <div className="flex flex-col gap-2">
              {names.map((name, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional inputs.
                  key={i}
                  className="flex items-center gap-2"
                >
                  <span className="w-6 shrink-0 text-center font-mono text-sm text-muted-foreground tabular">
                    {i + 1}
                  </span>
                  <Input
                    value={name}
                    onChange={(e) => updateName(i, e.target.value)}
                    placeholder={`Player ${i + 1}`}
                    maxLength={20}
                    aria-label={`Player ${i + 1} name`}
                  />
                  {names.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removePlayer(i)}
                      aria-label={`Remove player ${i + 1}`}
                    >
                      <X aria-hidden />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {names.length < MAX_PLAYERS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPlayer}
                className="self-start"
              >
                <Plus aria-hidden />
                Add player
              </Button>
            )}
          </section>
        )}

        {!isArcade && (
          <section className="flex flex-col gap-3">
            <Label className="font-heading text-xs tracking-widest uppercase">
              Lives
              <span className="ml-2 font-sans text-xs font-normal tracking-normal text-muted-foreground normal-case">
                wrong links before elimination
              </span>
            </Label>
            <Segmented
              options={LIVES_OPTIONS.map((v) => ({
                label: String(v),
                value: v,
              }))}
              value={lives}
              onChange={setLives}
            />
          </section>
        )}

        <section className="flex flex-col gap-3">
          <Label className="font-heading text-xs tracking-widest uppercase">
            {isArcade ? "Session timer" : "Turn timer"}
            <span className="ml-2 font-sans text-xs font-normal tracking-normal text-muted-foreground normal-case">
              {isArcade
                ? "total time on the clock"
                : "time to answer each turn"}
            </span>
          </Label>
          <Segmented
            options={timerOptions}
            value={turnSeconds}
            onChange={setTurnSeconds}
          />
        </section>

        <section className="flex flex-col gap-3">
          <Label className="font-heading text-xs tracking-widest uppercase">
            Restrictions
            <span className="ml-2 font-sans text-xs font-normal tracking-normal text-muted-foreground normal-case">
              randomly assigned at game start
            </span>
          </Label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Nationality</span>
              <Segmented
                options={[
                  { label: "Off", value: false },
                  { label: "On", value: true },
                ]}
                value={nationalityEnabled}
                onChange={setNationalityEnabled}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Position</span>
              <Segmented
                options={[
                  { label: "Off", value: false },
                  { label: "On", value: true },
                ]}
                value={positionEnabled}
                onChange={setPositionEnabled}
              />
            </div>
          </div>
        </section>

        {(error || startError) && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {error ?? startError}
          </p>
        )}

        <Button
          size="lg"
          onClick={handleStart}
          disabled={starting}
          className="w-full"
        >
          {starting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Picking a starting club…
            </>
          ) : (
            <>
              <Play aria-hidden />
              Start game
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
