import { GameProvider } from "@/components/game/game-provider";
import { GameScreen } from "@/components/game/game-screen";
import { SiteHeader } from "@/components/site-header";

export default function LocalPage() {
  return (
    <GameProvider mode="local">
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <GameScreen />
      </div>
    </GameProvider>
  );
}
