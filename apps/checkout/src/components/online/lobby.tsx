"use client";

import { useMutation } from "convex/react";
import { CheckIcon, CopyIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubjectPicker } from "@/components/game/subject-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MAX_VISIT } from "@/lib/game/engine";
import type { Subject } from "@/lib/subjects";
import { subjectCrestUrl } from "@/lib/subjects";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

const TIMER_OPTIONS: { label: string; seconds: number }[] = [
  { label: "no clock", seconds: 0 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
];

export function Lobby({
  room,
  deviceId,
}: {
  room: Doc<"rooms">;
  deviceId: string;
}) {
  const router = useRouter();
  const updateSettings = useMutation(api.rooms.updateSettings);
  const startGame = useMutation(api.rooms.startGame);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const [boardOpen, setBoardOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = room.hostDeviceId === deviceId;
  const subject = room.subject as Subject | null;
  const canStart = subject !== null && room.members.length >= 2;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (http, permissions) — the code is on screen anyway.
    }
  };

  const patchSettings = (
    patch: Partial<{
      turnSeconds: number;
      subject: Subject | null;
      limit180: boolean;
    }>,
  ) => {
    setError(null);
    updateSettings({ code: room.code, deviceId, ...patch }).catch(() =>
      setError("Couldn't update that setting."),
    );
  };

  const handleStart = () => {
    setError(null);
    startGame({ code: room.code, deviceId }).catch(() =>
      setError("Couldn't start — is a board picked and everyone in?"),
    );
  };

  const handleLeave = () => {
    leaveRoom({ code: room.code, deviceId })
      .catch(() => {
        // If leaving fails (e.g. game just started) stay put.
      })
      .then(() => router.push("/online"));
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          share the code · mates join at the oche
        </p>
        <button
          type="button"
          onClick={copyInvite}
          className="group flex items-center gap-3 rounded-lg border bg-card px-6 py-3 transition-colors hover:border-primary/60"
          aria-label="Copy invite link"
        >
          <span className="font-mono text-5xl font-semibold tracking-[0.3em] text-primary">
            {room.code}
          </span>
          {copied ? (
            <CheckIcon className="size-5 text-bed-green" />
          ) : (
            <CopyIcon className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
          )}
        </button>
      </header>

      <section className="w-full rounded-lg border bg-card/60">
        <p className="border-b px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {room.members.length} at the oche
        </p>
        <ul>
          {room.members.map((member, index) => (
            <li
              key={member.deviceId}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-2.5",
                index !== room.members.length - 1 &&
                  "border-b border-border/60",
              )}
            >
              <span className="flex items-baseline gap-2">
                <span className="font-marker text-base">{member.name}</span>
                {member.deviceId === deviceId && (
                  <span className="text-xs text-muted-foreground">you</span>
                )}
              </span>
              {member.deviceId === room.hostDeviceId && (
                <span className="text-[10px] uppercase tracking-[0.14em] text-primary">
                  holds the chalk
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/60 px-4 py-3">
          <span className="flex min-w-0 items-center gap-2.5">
            {subject ? (
              <>
                <Image
                  src={subjectCrestUrl(subject)}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 object-contain"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {subject.name}
                  </span>
                  {room.limit180 && (
                    <span className="text-xs text-primary">
                      {MAX_VISIT} max on
                    </span>
                  )}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                No board picked yet
              </span>
            )}
          </span>
          {isHost && (
            <Dialog open={boardOpen} onOpenChange={setBoardOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {subject ? "Change board" : "Pick the board"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl tracking-wide">
                    pick the board
                  </DialogTitle>
                </DialogHeader>
                <SubjectPicker
                  embedded
                  limit180={room.limit180}
                  onLimit180Change={(on) => patchSettings({ limit180: on })}
                  onPick={(picked) => {
                    patchSettings({ subject: picked });
                    setBoardOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/60 px-4 py-3">
          <span className="text-sm font-medium">Shot clock</span>
          <div className="flex gap-1.5">
            {TIMER_OPTIONS.map((option) => {
              const selected = room.turnSeconds === option.seconds;
              return (
                <button
                  key={option.seconds}
                  type="button"
                  disabled={!isHost}
                  onClick={() => patchSettings({ turnSeconds: option.seconds })}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-colors",
                    selected
                      ? "border-primary/60 bg-secondary text-primary"
                      : "border-border/60 text-muted-foreground",
                    isHost && !selected && "hover:border-primary/40",
                    !isHost && "cursor-default",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex w-full flex-col items-center gap-3">
        {isHost ? (
          <Button
            size="lg"
            className="w-full"
            disabled={!canStart}
            onClick={handleStart}
          >
            {canStart
              ? "Game on"
              : subject
                ? "Waiting for more throwers…"
                : "Pick a board to start"}
          </Button>
        ) : (
          <p className="animate-board-flicker text-sm text-muted-foreground">
            Waiting on{" "}
            {room.members.find((m) => m.deviceId === room.hostDeviceId)?.name ??
              "the host"}{" "}
            to call game on…
          </p>
        )}
        {error && <p className="text-sm text-treble">{error}</p>}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLeave}
          className="text-muted-foreground"
        >
          Leave the table
        </Button>
      </div>
    </div>
  );
}
