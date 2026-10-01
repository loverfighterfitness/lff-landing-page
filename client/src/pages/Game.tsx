import type { Character } from "@shared/game/types";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { startMusic, stopMusic } from "@/game/audio";
import CircuitCanvas, { type CircuitResult } from "@/game/CircuitCanvas";
import { loadPoses } from "@/game/render";
import { track } from "@/lib/analytics";
import { renderScoreCard, shareScoreCard } from "@/game/scoreCard";
import Leaderboard from "@/game/screens/Leaderboard";
import ResultsScreen from "@/game/screens/ResultsScreen";
import SelectScreen from "@/game/screens/SelectScreen";
import TitleScreen from "@/game/screens/TitleScreen";
import { ArcadeTitle, Panel, PixelButton, Screen } from "@/game/screens/ui";

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

type Run = { character: Character; seed: number; runId: string | null; eventOpen: boolean };
type View =
  | { name: "title" }
  | { name: "select" }
  | { name: "play"; run: Run }
  | { name: "results"; run: Run; result: CircuitResult }
  | { name: "board"; highlight?: string; posted?: { character: Character; result: CircuitResult; rank: number | null } };

export default function Game() {
  const [view, setView] = useState<View>({ name: "title" });
  const startRun = trpc.game.startRun.useMutation();

  // Pixel font only loads on /game.
  useEffect(() => {
    void loadPoses();
    document.title = "LFF Lover Fighter — win a free tee";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    // Unlisted for now: reachable by link only, kept out of search results.
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => {
      link.remove();
      robots.remove();
      stopMusic();
    };
  }, []);

  const begin = async (character: Character) => {
    track(`game_start:${character}`);
    startMusic();
    try {
      const res = await startRun.mutateAsync({ character });
      setView({ name: "play", run: { character, seed: res.seed, runId: res.runId, eventOpen: res.eventOpen } });
    } catch {
      // Server down: still playable as a practice run.
      const seed = Math.floor(Math.random() * 2 ** 32);
      setView({ name: "play", run: { character, seed, runId: null, eventOpen: false } });
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
          onAgain={() => begin(view.run.character)}
          onPosted={(handle, rank) => setView({ name: "board", highlight: handle, posted: { character: view.run.character, result: view.result, rank } })}
        />
      );
    case "board":
      return (
        <Screen>
          <ArcadeTitle size={14} style={{ marginTop: 4 }}>TEAM LFF LEADERBOARD</ArcadeTitle>
          <Panel>
            <Leaderboard highlightHandle={view.highlight} />
          </Panel>
          {view.posted && <ShareRankButton {...view.posted} />}
          <PixelButton variant={view.posted ? "cream" : "gold"} onClick={() => setView({ name: "select" })}>{view.highlight ? "RUN IT BACK" : "PLAY"}</PixelButton>
          <PixelButton variant="ghost" onClick={() => setView({ name: "title" })}>TITLE</PixelButton>
        </Screen>
      );
  }
}

/** After posting: share the story card with your leaderboard rank on it. */
function ShareRankButton({ character, result, rank }: { character: Character; result: CircuitResult; rank: number | null }) {
  const [busy, setBusy] = useState(false);
  const total = result.scores.bench + result.scores.squat + result.scores.deadlift;
  return (
    <PixelButton
      variant="gold"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const blob = await renderScoreCard({ character, scores: result.scores, total, rank });
          if (blob) {
            const how = await shareScoreCard(blob, character);
            if (how !== "cancelled") track(`game_share_rank:${how}`);
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "MAKING YOUR CARD..." : rank ? `SHARE MY RANK #${rank}` : "SHARE MY SCORE"}
    </PixelButton>
  );
}
