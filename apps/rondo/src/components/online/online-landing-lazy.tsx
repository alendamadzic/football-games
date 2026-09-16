"use client";

import dynamic from "next/dynamic";

// /online is otherwise eligible for static generation (no dynamic APIs
// used), but OnlineLanding calls useMutation unconditionally, which throws
// unless a ConvexProvider is present during render — including the
// build-time render Next does to produce that static shell. The shared
// ConvexClientProvider deliberately withholds the client outside the
// browser (see packages/shared/src/convex-provider.tsx) to keep
// ConvexReactClient's Math.random()-based session id out of prerendered
// output, so this subtree has to skip server rendering entirely rather
// than relying on a provider that's there during SSR.
export const OnlineLandingLazy = dynamic(
  () => import("./online-landing").then((m) => m.OnlineLanding),
  { ssr: false },
);
