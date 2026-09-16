import { OnlineNotConfigured } from "@/components/online/not-configured";
import { OnlineLandingLazy } from "@/components/online/online-landing-lazy";

export default function OnlinePage() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <OnlineNotConfigured />;
  return <OnlineLandingLazy />;
}
