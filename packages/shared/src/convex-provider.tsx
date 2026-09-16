"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useState } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Created lazily in render, and only in the browser. `useState`'s
  // initializer still runs on *any* first render, including the server-side
  // render Next does while statically prerendering pages like /_not-found —
  // so gating on `convexUrl` alone isn't enough: ConvexReactClient's
  // constructor calls Math.random() to mint a session id, and Next 16's
  // prerender flags that as an "unstable value" and fails the build. Gating
  // on `typeof window` too keeps construction out of every server/prerender
  // pass while still happening synchronously on the browser's first render
  // (no flash of a missing provider for children that call useQuery eagerly).
  // If the URL isn't configured yet (before `bunx convex dev`), skip the
  // provider so the rest of the app (solo/local/arcade modes) still works;
  // only the online routes actually need Convex.
  const [convex] = useState(() =>
    convexUrl && typeof window !== "undefined"
      ? new ConvexReactClient(convexUrl)
      : null,
  );
  if (!convex) return <>{children}</>;
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
