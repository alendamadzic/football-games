"use client";

import { useEffect, useRef } from "react";

/**
 * Measures the fixed guess dock and publishes its height as `--xi-dock-h` so
 * the page can reserve exactly that much bottom padding. The dock's height is
 * not constant — wrong-guess chips and the reveal card both grow it — so a
 * hardcoded spacer either clips the last sticker row or leaves dead space.
 */
export function useDockHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    if (!el) return;

    const write = () =>
      root.style.setProperty("--xi-dock-h", `${Math.round(el.offsetHeight)}px`);

    write();
    const observer = new ResizeObserver(write);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--xi-dock-h");
    };
  }, []);

  return ref;
}
