"use client";

import { useEffect, useRef, useState } from "react";

type CountdownOptions = {
  /** Total seconds for this countdown, or null to disable. */
  seconds: number | null;
  /** Whether the clock is currently ticking. */
  running: boolean;
  /** Change this to restart the countdown (e.g. on each new turn). */
  resetKey?: string | number;
  /** Fired once when the countdown reaches zero. */
  onExpire?: () => void;
};

/**
 * A wall-clock countdown that survives re-renders. Returns the remaining whole
 * seconds (or null when disabled). Restarts whenever `resetKey` changes.
 */
export function useCountdown({
  seconds,
  running,
  resetKey,
  onExpire,
}: CountdownOptions): number | null {
  const [remaining, setRemaining] = useState<number | null>(seconds);
  const deadlineRef = useRef<number | null>(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Restart whenever the duration or reset key changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetKey intentionally drives the restart.
  useEffect(() => {
    expiredRef.current = false;
    if (seconds == null) {
      deadlineRef.current = null;
      setRemaining(null);
      return;
    }
    deadlineRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
  }, [seconds, resetKey]);

  useEffect(() => {
    if (seconds == null || !running) return;

    const tick = () => {
      if (deadlineRef.current == null) return;
      const left = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [seconds, running]);

  return remaining;
}
