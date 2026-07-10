"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { MultiGameBoard } from "@/components/game/multi/multi-game-board";
import { Lobby } from "@/components/online/lobby";
import { OnlineGameProvider } from "@/components/online/online-game-provider";
import { PENDING_JOIN_KEY } from "@/components/online/online-landing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeviceId } from "@/hooks/use-device-id";
import type { MultiGameState } from "@/lib/game/engine";
import type { Subject } from "@/lib/subjects";
import { api } from "../../../convex/_generated/api";

function CenteredNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      {children}
    </div>
  );
}

export function Room({ code }: { code: string }) {
  const deviceId = useDeviceId();
  const room = useQuery(api.rooms.getByCode, { code });
  const joinRoom = useMutation(api.rooms.joinRoom);
  const [name, setName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, startJoining] = useTransition();

  const isMember =
    room != null &&
    deviceId !== null &&
    room.members.some((member) => member.deviceId === deviceId);

  const roomIsOpen = room != null && room.state === null;

  // Arrivals from the online landing carry a pending nickname — seat them
  // without a second form.
  useEffect(() => {
    if (!roomIsOpen || isMember || deviceId === null) return;
    const pending = sessionStorage.getItem(PENDING_JOIN_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_JOIN_KEY);
    setName(pending);
    startJoining(async () => {
      try {
        await joinRoom({ code, deviceId, name: pending });
      } catch {
        setJoinError("Couldn't get you a seat. Try again.");
      }
    });
  }, [roomIsOpen, isMember, deviceId, code, joinRoom]);

  useEffect(() => {
    const stored = localStorage.getItem("checkout:nickname");
    if (stored) setName((current) => current || stored);
  }, []);

  if (room === undefined || deviceId === null) {
    return (
      <CenteredNote>
        <p className="animate-board-flicker text-sm uppercase tracking-[0.22em] text-muted-foreground">
          chalking the board…
        </p>
      </CenteredNote>
    );
  }

  if (room === null) {
    return (
      <CenteredNote>
        <h1 className="font-display text-5xl leading-none tracking-wide">
          no board here<span className="text-primary">.</span>
        </h1>
        <p className="text-balance text-muted-foreground">
          Nothing chalked under <span className="font-mono">{code}</span>. The
          game may have wrapped up and been wiped off.
        </p>
        <Button asChild variant="outline">
          <Link href="/online">Back to online play</Link>
        </Button>
      </CenteredNote>
    );
  }

  if (!isMember) {
    if (room.state !== null) {
      return (
        <CenteredNote>
          <h1 className="font-display text-5xl leading-none tracking-wide">
            game on<span className="text-primary">.</span>
          </h1>
          <p className="text-balance text-muted-foreground">
            This one&apos;s already underway — darts are flying. Get a fresh
            code from your mates for the next leg.
          </p>
          <Button asChild variant="outline">
            <Link href="/online">Back to online play</Link>
          </Button>
        </CenteredNote>
      );
    }
    const trimmed = name.trim();
    const submitJoin = () => {
      if (trimmed.length === 0) return;
      setJoinError(null);
      localStorage.setItem("checkout:nickname", trimmed);
      startJoining(async () => {
        try {
          await joinRoom({ code, deviceId, name: trimmed });
        } catch {
          setJoinError("Couldn't get you a seat — the oche may be full.");
        }
      });
    };
    return (
      <CenteredNote>
        <h1 className="font-display text-5xl leading-none tracking-wide">
          take a seat<span className="text-primary">.</span>
        </h1>
        <p className="text-balance text-muted-foreground">
          You&apos;ve been invited to board{" "}
          <span className="font-mono text-primary">{code}</span>. Chalk your
          name to join.
        </p>
        <div className="flex w-full gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Big Al"
            maxLength={20}
            className="bg-card"
            onKeyDown={(event) => {
              if (event.key === "Enter") submitJoin();
            }}
          />
          <Button
            disabled={trimmed.length === 0 || isJoining}
            onClick={submitJoin}
          >
            {isJoining ? "Chalking…" : "Join"}
          </Button>
        </div>
        {joinError && <p className="text-sm text-treble">{joinError}</p>}
      </CenteredNote>
    );
  }

  if (room.state === null) {
    return <Lobby room={room} deviceId={deviceId} />;
  }

  if (!room.subject) {
    // Unreachable: startGame requires a subject. Guard for type narrowing.
    return null;
  }

  return (
    <OnlineGameProvider
      room={{
        ...room,
        state: room.state as MultiGameState,
        subject: room.subject as Subject,
      }}
      deviceId={deviceId}
    >
      <MultiGameBoard />
    </OnlineGameProvider>
  );
}
