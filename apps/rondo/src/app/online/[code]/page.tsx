import { Suspense } from "react";
import { OnlineNotConfigured } from "@/components/online/online-not-configured";
import { OnlineRoom } from "@/components/online/online-room";
import { SiteHeader } from "@/components/site-header";

export default function OnlineRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <Suspense>
          <RoomContent params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function RoomContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const configured = !!process.env.NEXT_PUBLIC_CONVEX_URL;
  return configured ? (
    <OnlineRoom code={code.toUpperCase()} />
  ) : (
    <OnlineNotConfigured />
  );
}
