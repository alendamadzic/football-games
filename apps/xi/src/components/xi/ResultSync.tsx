"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { todayUTC } from "@/lib/format";
import { getUserId } from "@/lib/user-id";
import { api } from "../../../convex/_generated/api";

export function ResultSync({
  matchSlug,
  status,
  score,
  lives,
  seconds,
}: {
  matchSlug: string;
  status: "playing" | "won" | "lost";
  score: number;
  lives: number;
  seconds: number;
}) {
  const saveResult = useMutation(api.results.saveResult);
  const synced = useRef(false);

  useEffect(() => {
    if (status === "playing" || synced.current) return;
    synced.current = true;

    const userId = getUserId();
    const date = todayUTC();
    const won = status === "won";

    void saveResult({
      userId,
      matchSlug,
      date,
      score,
      livesRemaining: lives,
      timeTakenSeconds: seconds,
      completed: true,
      won,
    });
  }, [status, matchSlug, score, lives, seconds, saveResult]);

  return null;
}
