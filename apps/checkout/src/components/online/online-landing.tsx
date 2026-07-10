"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeviceId } from "@/hooks/use-device-id";
import { api } from "../../../convex/_generated/api";

const NICKNAME_KEY = "checkout:nickname";
/** Handed to /room/[code] so arriving from this form joins automatically. */
export const PENDING_JOIN_KEY = "checkout:pendingJoin";

export function OnlineLanding() {
  const router = useRouter();
  const deviceId = useDeviceId();
  const createRoom = useMutation(api.rooms.createRoom);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isWorking, startWorking] = useTransition();

  useEffect(() => {
    const stored = localStorage.getItem(NICKNAME_KEY);
    if (stored) setName(stored);
  }, []);

  const trimmedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();
  const ready = trimmedName.length > 0 && deviceId !== null;

  const handleCreate = () => {
    if (!ready || !deviceId) return;
    setError(null);
    startWorking(async () => {
      try {
        localStorage.setItem(NICKNAME_KEY, trimmedName);
        const { code: newCode } = await createRoom({
          deviceId,
          name: trimmedName,
        });
        router.push(`/room/${newCode}`);
      } catch {
        setError("Couldn't chalk a new board. Try again.");
      }
    });
  };

  const handleJoin = () => {
    if (!ready || normalizedCode.length !== 4) return;
    localStorage.setItem(NICKNAME_KEY, trimmedName);
    sessionStorage.setItem(PENDING_JOIN_KEY, trimmedName);
    router.push(`/room/${normalizedCode}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-display text-5xl leading-none tracking-wide sm:text-6xl">
          online<span className="text-primary">.</span>
        </h1>
        <p className="max-w-sm text-balance text-muted-foreground">
          Own devices, one board. Chalk your name, then start a game or join
          with a four-letter code.
        </p>
      </header>

      <div className="flex w-full flex-col gap-2">
        <label
          htmlFor="nickname"
          className="px-1 text-xs uppercase tracking-[0.18em] text-muted-foreground"
        >
          your name on the sheet
        </label>
        <Input
          id="nickname"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Big Al"
          maxLength={20}
          className="bg-card"
        />
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button
          size="lg"
          disabled={!ready || isWorking}
          onClick={handleCreate}
          className="w-full"
        >
          {isWorking ? "Chalking it up…" : "Start a new game"}
        </Button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            or join your mates
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="CODE"
            maxLength={4}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="bg-card text-center font-mono text-lg tracking-[0.4em] uppercase"
            onKeyDown={(event) => {
              if (event.key === "Enter") handleJoin();
            }}
          />
          <Button
            variant="outline"
            size="lg"
            disabled={!ready || normalizedCode.length !== 4}
            onClick={handleJoin}
          >
            Join
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-treble">{error}</p>}
    </div>
  );
}
