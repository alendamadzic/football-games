"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getUserId } from "@/lib/user-id";
import { todayUTC } from "@/lib/format";

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
