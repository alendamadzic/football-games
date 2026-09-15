import { OnlineLanding } from "@/components/online/online-landing";
import { OnlineNotConfigured } from "@/components/online/online-not-configured";
import { SiteHeader } from "@/components/site-header";

export default function OnlinePage() {
  const configured = !!process.env.NEXT_PUBLIC_CONVEX_URL;
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        {configured ? <OnlineLanding /> : <OnlineNotConfigured />}
      </div>
    </>
  );
}
