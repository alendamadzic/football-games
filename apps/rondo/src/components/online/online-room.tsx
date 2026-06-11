"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Check,
  Copy,
  Crown,
  Loader2,
  Play,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { GameScreen } from "@/components/game/game-screen";
import { OnlineGameProvider } from "@/components/game/online-game-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeviceId } from "@/hooks/use-device-id";
import {
  MAJOR_NATION_NAMES,
  RESTRICTED_POSITIONS,
} from "@/lib/game/difficulty";
import type { GameState } from "@/lib/game/types";
import { getStartingClubAction } from "@/lib/sportsdb/actions";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

type Room = Doc<"rooms">;

export function OnlineRoom({ code }: { code: string }) {
  const deviceId = useDeviceId();
  const room = useQuery(api.rooms.getByCode, { code });

  if (deviceId === null || room === undefined) {
    return <CenterNote spinner>Loading game…</CenterNote>;
  }
  if (room === null) {
    return (
      <CenterNote>
        <p className="font-heading text-2xl uppercase">Game not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Double-check the code, or start a new game.
        </p>
        <Button
          className="mt-5"
          nativeButton={false}
          render={<Link href="/online" />}
        >
          Back to online
        </Button>
      </CenterNote>
    );
  }

  const isMember = room.members.some((m) => m.deviceId === deviceId);
  if (!isMember)
    return <JoinForm code={code} room={room} deviceId={deviceId} />;

  // Lobby until the host starts (state is null pre-game).
  if (room.state === null) {
    return <Lobby room={room} deviceId={deviceId} />;
  }

  return (
    <OnlineGameProvider
      room={room as Room & { state: GameState }}
      deviceId={deviceId}
    >
      <GameScreen />
    </OnlineGameProvider>
  );
}

function CenterNote({
  children,
  spinner,
}: {
  children: React.ReactNode;
  spinner?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      {spinner && (
        <Loader2
          className="mb-3 size-6 animate-spin text-muted-foreground"
          aria-hidden
        />
      )}
      {children}
    </div>
  );
}

function JoinForm({
  code,
  room,
  deviceId,
}: {
  code: string;
  room: Room;
  deviceId: string;
}) {
  const join = useMutation(api.rooms.joinRoom);
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = room.state !== null;

  async function handleJoin() {
    setError(null);
    if (!name.trim()) {
      setError("Enter your name to join.");
      return;
    }
    setJoining(true);
    try {
      await join({ code, deviceId, name: name.trim() });
    } catch {
      setError(
        locked
          ? "This game has already started — you can't join now."
          : "Couldn't join the game. Please try again.",
      );
      setJoining(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <div className="mb-6 text-center">
        <p className="font-heading text-sm tracking-widest text-primary uppercase">
          Joining game
        </p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em]">
          {code}
        </p>
      </div>
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
        <Label
          htmlFor="player-name"
          className="font-heading text-xs tracking-widest uppercase"
        >
          Your name
        </Label>
        <Input
          id="player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alen"
          maxLength={20}
          disabled={locked}
          autoFocus
        />
        <Button
          size="lg"
          onClick={handleJoin}
          disabled={joining || locked}
          className="w-full"
        >
          {joining ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Joining…
            </>
          ) : (
            "Join game"
          )}
        </Button>
        {(error || locked) && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {error ?? "This game has already started."}
          </p>
        )}
      </div>
    </div>
  );
}

const TIMER_OPTIONS = [
  { label: "Off", value: null },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "2m", value: 120 },
  { label: "Dynamic", value: "dynamic" as const },
] as const;

const LIVES_OPTIONS = [1, 2, 3] as const;

function Lobby({ room, deviceId }: { room: Room; deviceId: string }) {
  const startGame = useMutation(api.rooms.startGame);
  const isHost = room.hostDeviceId === deviceId;

  const [turnSeconds, setTurnSeconds] = useState<number | "dynamic" | null>(60);
  const [lives, setLives] = useState<number>(1);
  const [nationalityEnabled, setNationalityEnabled] = useState(false);
  const [positionEnabled, setPositionEnabled] = useState(false);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = room.members.length >= 2;

  async function copyLink() {
    const url = `${window.location.origin}/online/${room.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  async function handleStart() {
    setError(null);
    setStarting(true);
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
    try {
      const seed = await getStartingClubAction(restrictions);
      if (!seed) {
        setError("Couldn't reach the football database. Try again.");
        setStarting(false);
        return;
      }
      await startGame({
        code: room.code,
        hostDeviceId: deviceId,
        config: {
          mode: "local",
          turnSeconds,
          lives,
          playerNames: [],
          restrictions,
        },
        seed: { id: seed.id, name: seed.name, badge: seed.badge },
      });
    } catch {
      setError("Couldn't start the game. Please try again.");
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-10">
      <div className="mb-6 text-center">
        <p className="font-heading text-sm tracking-widest text-primary uppercase">
          Lobby
        </p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-[0.3em]">
          {room.code}
        </p>
        <Button variant="outline" size="sm" onClick={copyLink} className="mt-3">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied!" : "Copy invite link"}
        </Button>
      </div>

      <section className="mb-6 flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
        <Label className="flex items-center gap-2 font-heading text-xs tracking-widest uppercase">
          <Users className="size-3.5" aria-hidden />
          Players ({room.members.length})
        </Label>
        <div className="flex flex-col gap-2">
          {room.members.map((m) => (
            <div
              key={m.deviceId}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              {m.deviceId === room.hostDeviceId && (
                <Crown className="size-4 text-primary" aria-hidden />
              )}
              <span className="font-medium">{m.name}</span>
              {m.deviceId === deviceId && (
                <span className="text-xs text-muted-foreground">(you)</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {isHost ? (
        <div className="flex flex-col gap-6 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
          <Setting label="Lives" hint="wrong links before elimination">
            <Segmented
              options={LIVES_OPTIONS.map((v) => ({
                label: String(v),
                value: v,
              }))}
              value={lives}
              onChange={setLives}
            />
          </Setting>
          <Setting label="Turn timer" hint="time to answer each turn">
            <Segmented
              options={TIMER_OPTIONS}
              value={turnSeconds}
              onChange={setTurnSeconds}
            />
          </Setting>
          <Setting label="Restrictions" hint="randomly assigned at game start">
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
          </Setting>

          {error && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <Button
            size="lg"
            onClick={handleStart}
            disabled={starting || !canStart}
            className="w-full"
          >
            {starting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Starting…
              </>
            ) : (
              <>
                <Play aria-hidden />
                {canStart ? "Start game" : "Waiting for players…"}
              </>
            )}
          </Button>
        </div>
      ) : (
        <CenterNote spinner>Waiting for the host to start the game…</CenterNote>
      )}
    </div>
  );
}

function Setting({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <Label className="font-heading text-xs tracking-widest uppercase">
        {label}
        <span className="ml-2 font-sans text-xs font-normal tracking-normal text-muted-foreground normal-case">
          {hint}
        </span>
      </Label>
      {children}
    </section>
  );
}

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
