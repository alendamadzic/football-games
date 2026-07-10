"use client";

import { useEffect, useState } from "react";

/** Whole seconds remaining until `deadline` (epoch ms), or null without one. */
export function useCountdown(deadline: number | null): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (deadline === null) {
      setSecondsLeft(null);
      return;
    }
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return secondsLeft;
}
