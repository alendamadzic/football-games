"use client";

import { useEffect, useState } from "react";

export interface ViewportState {
  /** Pixels of the layout viewport occluded at the bottom — i.e. the keyboard. */
  keyboardInset: number;
  keyboardOpen: boolean;
}

// Anything smaller than this is viewport jitter (iOS toolbar collapse), not a
// keyboard.
const KEYBOARD_THRESHOLD = 120;

/**
 * Tracks the software keyboard via the VisualViewport API and mirrors the
 * occluded height onto `--xi-kb` at the document root.
 *
 * `interactive-widget=resizes-content` (set in the root layout) covers Chrome
 * and Android. iOS Safari ignores it: it overlays the keyboard on the visual
 * viewport while leaving `position: fixed` elements pinned to the *layout*
 * viewport, so the guess dock ends up behind the keyboard. Translating the dock
 * up by this inset is what keeps it on screen there.
 */
export function useVisualViewport(): ViewportState {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const inset = Math.max(
          0,
          Math.round(window.innerHeight - (vv.height + vv.offsetTop)),
        );
        setKeyboardInset(inset);
        document.documentElement.style.setProperty("--xi-kb", `${inset}px`);
      });
    };

    measure();
    vv.addEventListener("resize", measure);
    vv.addEventListener("scroll", measure);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", measure);
      vv.removeEventListener("scroll", measure);
      document.documentElement.style.removeProperty("--xi-kb");
    };
  }, []);

  return {
    keyboardInset,
    keyboardOpen: keyboardInset > KEYBOARD_THRESHOLD,
  };
}
