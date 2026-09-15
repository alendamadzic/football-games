"use client";

import { Button } from "@football/ui/components/button";
import { Input } from "@football/ui/components/input";
import { Label } from "@football/ui/components/label";
import { useMutation } from "convex/react";
import { Loader2, LogIn, Plus, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDeviceId } from "@/hooks/use-device-id";
import { api } from "../../../convex/_generated/api";

export function OnlineLanding() {
  const router = useRouter();
  const deviceId = useDeviceId();
  const createRoom = useMutation(api.rooms.createRoom);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (!deviceId) return;
    if (!name.trim()) {
      setError("Enter your name to host a game.");
      return;
    }
    setCreating(true);
    try {
      const { code: newCode } = await createRoom({
        hostDeviceId: deviceId,
        hostName: name.trim(),
      });
      router.push(`/online/${newCode}`);
    } catch {
      setError("Couldn't create a game. Please try again.");
      setCreating(false);
    }
  }

  function handleJoin() {
    setError(null);
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      setError("Enter the 4-character game code.");
      return;
    }
    router.push(`/online/${c}`);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <p className="font-heading text-sm tracking-widest text-primary uppercase">
          Online Multiplayer
        </p>
        <h1 className="mt-1 font-heading text-4xl uppercase sm:text-5xl">
          Play anywhere
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Host a game and share the code — everyone plays from their own device.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
          <Label
            htmlFor="host-name"
            className="font-heading text-xs tracking-widest uppercase"
          >
            Your name
          </Label>
          <Input
            id="host-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alen"
            maxLength={20}
          />
          <Button
            size="lg"
            onClick={handleCreate}
            disabled={creating || !deviceId}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Creating game…
              </>
            ) : (
              <>
                <Plus aria-hidden />
                Create game
              </>
            )}
          </Button>
        </section>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>

        <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
          <Label
            htmlFor="join-code"
            className="font-heading text-xs tracking-widest uppercase"
          >
            Join with a code
          </Label>
          <Input
            id="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            maxLength={4}
            autoCapitalize="characters"
            className="text-center font-mono text-2xl tracking-[0.4em] uppercase"
          />
          <Button
            size="lg"
            variant="outline"
            onClick={handleJoin}
            className="w-full"
          >
            <LogIn aria-hidden />
            Join game
          </Button>
        </section>

        {error && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
