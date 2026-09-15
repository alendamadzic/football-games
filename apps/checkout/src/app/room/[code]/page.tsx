import { OnlineNotConfigured } from "@/components/online/not-configured";
import { Room } from "@/components/online/room";

export default async function RoomPage(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <OnlineNotConfigured />;
  return <Room code={code.toUpperCase()} />;
}
