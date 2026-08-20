"use client";

import { useCallback, useSyncExternalStore } from "react";

// SSR-safe `matchMedia`. Returns `false` on the server and during the first
// client render so markup matches, then settles on the real value.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

// Two readings used all over the game screen.
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}

export function useIsTouch(): boolean {
  return useMediaQuery("(pointer: coarse)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
