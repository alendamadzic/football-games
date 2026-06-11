"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "rondo:deviceId";

/**
 * A stable per-browser identifier, persisted in localStorage. Used to claim and
 * rejoin an online seat without accounts. Returns null on the first render
 * (before the effect runs / during SSR) so callers can gate on it.
 */
export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
}
