"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "checkout:deviceId";

/**
 * Anonymous per-browser identity for online rooms. Null during SSR and the
 * first client render; callers should gate on it.
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
