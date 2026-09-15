import { OnlineNotConfigured } from "@/components/online/not-configured";
import { OnlineLanding } from "@/components/online/online-landing";

export default function OnlinePage() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <OnlineNotConfigured />;
  return <OnlineLanding />;
}
