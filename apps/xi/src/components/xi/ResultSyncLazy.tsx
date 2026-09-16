"use client";

import dynamic from "next/dynamic";

// The homepage is otherwise eligible for static generation (no dynamic
// APIs used), but ResultSync calls useMutation unconditionally, which
// throws unless a ConvexProvider is present during render — including the
// build-time render Next does to produce that static shell. The shared
// ConvexClientProvider deliberately withholds the client outside the
// browser (see packages/shared/src/convex-provider.tsx) to keep
// ConvexReactClient's Math.random()-based session id out of prerendered
// output, so this component has to skip server rendering entirely rather
// than relying on a provider that's there during SSR. It renders nothing
// either way, so there's no loading state to worry about.
export const ResultSyncLazy = dynamic(
  () => import("./ResultSync").then((m) => m.ResultSync),
  { ssr: false },
);
