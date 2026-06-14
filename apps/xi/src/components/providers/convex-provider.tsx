"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useState } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Created lazily in render (not at module scope) so the client's internal
  // Math.random()-based session id isn't generated during static prerender.
  // If the URL isn't configured yet (before `bunx convex dev`), skip the
  // provider so the app still renders.
  const [convex] = useState(() =>
    convexUrl ? new ConvexReactClient(convexUrl) : null,
  );
  if (!convex) return <>{children}</>;
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
