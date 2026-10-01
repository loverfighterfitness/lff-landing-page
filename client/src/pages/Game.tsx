import type { Character } from "@shared/game/types";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { startMusic, stopMusic } from "@/game/audio";
import CircuitCanvas, { type CircuitResult } from "@/game/CircuitCanvas";
import Leaderboard from "@/game/screens/Leaderboard";
import ResultsScreen from "@/game/screens/ResultsScreen";
import SelectScreen from "@/game/screens/SelectScreen";
import TitleScreen from "@/game/screens/TitleScreen";
import { PixelButton, Screen } from "@/game/screens/ui";

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

type Run = { character: Character; gold: boolean; seed: number; runId: string | null; eventOpen: boolean };
type View =
  | { name: "title" }
  | { name: "select" }
  | { name: "play"; run: Run }
  | { name: "results"; run: Run; result: CircuitResult }
  | { name: "board"; highlight?: string };

export default function Game() {
  const [view, setView] = useState<View>({ name: "title" });
  const startRun = trpc.game.startRun.useMutation();

  // Pixel font only loads on /game.
  useEffect(() => {
    document.title = "LFF Gym — win a free tee";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    return () => {
      link.remove();
      stopMusic();
    };
  }, []);

  const begin = async (character: Character, gold: boolean) => {
    startMusic();
    try {
      const res = await startRun.mutateAsync({ character });
      setView({ name: "play", run: { character, gold, seed: res.seed, runId: res.runId, eventOpen: res.eventOpen } });
    } catch {
      // Server down: still playable as a practice run.
      const seed = Math.floor(Math.random() * 2 ** 32);
      setView({ name: "play", run: { character, gold, seed, runId: null, eventOpen: false } });
    }
  };

  switch (view.name) {
    case "title":
      return <TitleScreen onPlay={() => setView({ name: "select" })} onBoard={() => setView({ name: "board" })} />;
    case "select":
      return <SelectScreen onPick={begin} onBack={() => setView({ name: "title" })} starting={startRun.isPending} />;
    case "play":
      return (
        <CircuitCanvas
          key={view.run.seed}
          seed={view.run.seed}
          character={view.run.character}
          gold={view.run.gold}
          onFinish={(result) => setView({ name: "results", run: view.run, result })}
        />
      );
    case "results":
      return (
        <ResultsScreen
          character={view.run.character}
          runId={view.run.runId}
          eventOpen={view.run.eventOpen}
          result={view.result}
          onAgain={() => begin(view.run.character, view.run.gold)}
          onPosted={(handle) => setView({ name: "board", highlight: handle })}
        />
      );
    case "board":
      return (
        <Screen>
          <h2 className="text-sm mt-4">LEADERBOARD</h2>
          <Leaderboard highlightHandle={view.highlight} />
          <PixelButton onClick={() => setView({ name: "select" })}>{view.highlight ? "RUN IT BACK" : "PLAY"}</PixelButton>
          <PixelButton variant="ghost" onClick={() => setView({ name: "title" })}>TITLE</PixelButton>
        </Screen>
      );
  }
}
