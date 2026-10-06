import type { Character } from "@shared/game/types";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { startMusic, stopMusic } from "@/game/audio";
import CircuitCanvas, { type CircuitResult } from "@/game/CircuitCanvas";
import { loadPoses } from "@/game/render";
import { savedHandle } from "@/game/player";
import HandleScreen from "@/game/screens/HandleScreen";
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
  | { name: "handle" }
  | { name: "select" }
  | { name: "play"; run: Run }
  | { name: "results"; run: Run; result: CircuitResult }
  | { name: "board"; highlight?: string; posted?: { character: Character; result: CircuitResult; rank: number | null } };

export default function Game() {
  const [view, setView] = useState<View>({ name: "title" });
  // Instagram handle, asked once before the first run and remembered on this device.
  const [handle, setHandle] = useState(savedHandle);
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

  // Shown on fighter select when a run couldn't be registered with the server.
  const [startError, setStartError] = useState<{ message: string; character: Character; n: number } | null>(null);

  const begin = async (character: Character, practice = false) => {
    track(`game_start:${character}`);
    startMusic();
    setStartError(null);
    if (practice) {
      setView({ name: "play", run: { character, seed: Math.floor(Math.random() * 2 ** 32), runId: null, eventOpen: false } });
      return;
    }
    // A run only counts if the server issued it, so retry a flaky connection rather than silently
    // falling back to practice (players were finishing great runs that could never post).
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await startRun.mutateAsync({ character });
        setView({ name: "play", run: { character, seed: res.seed, runId: res.runId, eventOpen: res.eventOpen } });
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (/too many runs/i.test(msg) || attempt === 2) {
          track("game_start_failed");
          setStartError({
            message: /too many runs/i.test(msg) ? msg : "Can't reach the leaderboard. Check your signal and tap LIFT! again.",
            character,
            n: (startError?.n ?? 0) + 1,
          });
          setView({ name: "select" });
          return;
        }
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      }
    }
  };

  // Every way into a run goes through the handle screen first if we don't have one yet
  // (e.g. a new player who opened the leaderboard before playing), so comp runs always post.
  const toPlay = () => setView(handle ? { name: "select" } : { name: "handle" });

  switch (view.name) {
    case "title":
      return <TitleScreen onPlay={toPlay} onBoard={() => setView({ name: "board" })} />;
    case "handle":
      return (
        <HandleScreen
          initial={handle}
          onDone={(h) => {
            setHandle(h);
            setView({ name: "select" });
          }}
          onBack={() => setView({ name: "title" })}
        />
      );
    case "select":
      return (
        <SelectScreen
          key={startError?.n ?? 0}
          onPick={(c) => void begin(c)}
          error={startError?.message}
          onPractice={startError ? () => void begin(startError.character, true) : undefined}
          onBack={() => setView({ name: "title" })}
          starting={startRun.isPending}
          handle={handle}
          onChangeHandle={() => setView({ name: "handle" })}
        />
      );
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
          handle={handle}
          onHandle={setHandle}
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
          <PixelButton variant={view.posted ? "cream" : "gold"} onClick={toPlay}>{view.highlight ? "RUN IT BACK" : "PLAY"}</PixelButton>
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
