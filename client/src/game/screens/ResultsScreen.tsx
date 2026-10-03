import type { Character } from "@shared/game/types";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { jingle } from "../audio";
import type { CircuitResult } from "../CircuitCanvas";
import { CHARACTER_INFO, COACHING_CTA, IG_DM_URL, IG_PROFILE_URL, PRACTICE_LINE, RUBY_PODIUM_LINE, SHOP_CTA } from "../content";
import { renderScoreCard, shareScoreCard } from "../scoreCard";
import { BAD, BLUE, CREAM } from "../theme";
import { ArcadeTitle, Fighter, Panel, PixelButton, Screen } from "./ui";

export default function ResultsScreen({
  character,
  runId,
  eventOpen,
  handle,
  result,
  onAgain,
  onPosted,
}: {
  character: Character;
  runId: string | null;
  eventOpen: boolean;
  /** Instagram handle entered at the start; the run posts under it automatically. */
  handle: string;
  result: CircuitResult;
  onAgain: () => void;
  onPosted: (handle: string, rank: number | null) => void;
}) {
  const [posted, setPosted] = useState<{ rank: number | null } | null>(null);
  const [error, setError] = useState("");
  const submit = trpc.game.submitRun.useMutation();
  const total = result.scores.bench + result.scores.squat + result.scores.deadlift;
  const info = CHARACTER_INFO[character];
  const quote = info.winQuotes[total % info.winQuotes.length];
  const [sharing, setSharing] = useState(false);
  const [newPb, setNewPb] = useState(false);
  // This device's best before this run (0 on a first run).
  const [prevBest, setPrevBest] = useState(0);

  useEffect(() => {
    track("game_finish", Math.min(86400, total));
    // Personal best (per device): play the LFF sting.
    try {
      const best = Number(localStorage.getItem("lff-gym-pb") ?? 0);
      setPrevBest(best);
      if (total > best) {
        localStorage.setItem("lff-gym-pb", String(total));
        if (best > 0) {
          setNewPb(true);
          jingle();
        }
      }
    } catch {
      /* private mode */
    }
  }, [total]);

  const share = async () => {
    setSharing(true);
    try {
      const blob = await renderScoreCard({ character, scores: result.scores, total, rank: null });
      if (blob) {
        const how = await shareScoreCard(blob, character);
        if (how !== "cancelled") track(`game_share:${how}`);
      }
    } finally {
      setSharing(false);
    }
  };

  const post = async () => {
    if (!runId || !handle || submit.isPending) return;
    setError("");
    try {
      const res = await submit.mutateAsync({ runId, handle, logs: result.logs });
      track("game_post", Math.min(86400, total));
      setPosted({ rank: res.rank });
    } catch (err) {
      // Network failures keep the run here so the player can retry.
      const msg = err instanceof Error ? err.message : "";
      setError(msg && !msg.startsWith("[") && !msg.startsWith("{") ? msg : "Couldn't post your score.");
    }
  };

  // Every run in an open comp posts itself under the handle entered at the start.
  const autoPosted = useRef(false);
  useEffect(() => {
    if (autoPosted.current || !runId || !eventOpen || !handle) return;
    autoPosted.current = true;
    void post();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPost = !!runId && eventOpen && !!handle;

  return (
    <Screen>
      <ArcadeTitle size={16} style={{ marginTop: 4, animation: "lff-pop 0.4s ease-out both" }}>
        CIRCUIT COMPLETE
      </ArcadeTitle>
      <Fighter id={character} pose="victory" height={190} />
      {newPb && (
        <p className="text-[10px]" style={{ color: BLUE, animation: "lff-blink 0.6s steps(1) 6" }}>
          NEW PB{prevBest > 0 ? ` · +${total - prevBest}KG` : ""}
        </p>
      )}
      {!newPb && prevBest > total && (
        <p className="text-[9px] text-center leading-loose" style={{ color: CREAM, textShadow: "2px 2px 0 #000" }}>
          <span style={{ color: BLUE }}>{prevBest - total}KG</span> OFF YOUR PB ({prevBest}KG). GO AGAIN.
        </p>
      )}
      <p className="text-[10px] text-center leading-loose" style={{ textShadow: "2px 2px 0 #000" }}>"{quote}" - {info.name}</p>
      {character === "ruby" && result.perfects >= 8 && <p className="text-lg">{RUBY_PODIUM_LINE}</p>}
      <Panel>
      <div className="w-full flex flex-col gap-2 text-[10px]">
        <div className="flex justify-between"><span>BENCH</span><span>{result.scores.bench}KG</span></div>
        <div className="flex justify-between"><span>SQUATS</span><span>{result.scores.squat}KG</span></div>
        <div className="flex justify-between"><span>DEADLIFT</span><span>{result.scores.deadlift}KG</span></div>
        <div className="flex justify-between text-sm pt-2" style={{ borderTop: "2px solid #EAE6D2" }}>
          <span>TOTAL</span><span style={{ color: BLUE }}>{total}KG</span>
        </div>
      </div>
      </Panel>

      {canPost ? (
        <Panel>
          <div className="w-full flex flex-col gap-3 text-[10px] text-center leading-loose">
            {posted ? (
              <>
                <p>
                  POSTED AS <span style={{ color: BLUE }}>@{handle}</span>
                  {posted.rank ? (
                    <>
                      <br />
                      <span className="text-sm" style={{ color: BLUE }}>RANK #{posted.rank}</span>
                    </>
                  ) : null}
                </p>
                <PixelButton onClick={() => onPosted(handle, posted.rank)}>SEE LEADERBOARD</PixelButton>
              </>
            ) : error ? (
              <>
                <p style={{ color: BAD }}>{error}</p>
                <PixelButton onClick={() => void post()} disabled={submit.isPending}>
                  {submit.isPending ? "POSTING..." : "RETRY"}
                </PixelButton>
              </>
            ) : (
              <p>POSTING YOUR TOTAL AS <span style={{ color: BLUE }}>@{handle}</span>...</p>
            )}
          </div>
        </Panel>
      ) : (
        <p className="text-[10px] text-center leading-loose opacity-80">
          {PRACTICE_LINE}{" "}
          <a href={IG_PROFILE_URL} target="_blank" rel="noreferrer" className="underline" style={{ color: BLUE }}>
            @loverfighterfitness
          </a>
        </p>
      )}

      <PixelButton variant="gold" onClick={share} disabled={sharing}>
        {sharing ? "MAKING YOUR CARD..." : "SHARE MY SCORE"}
      </PixelButton>
      <PixelButton variant="ghost" onClick={onAgain}>RUN IT BACK</PixelButton>
      <a
        href={`/shop?tee=${info.tee}`}
        onClick={() => track(`game_shop_click:${info.tee}`)}
        className="w-full block text-[10px] text-center leading-relaxed py-3 px-3"
        style={{ border: "2px solid rgba(234,230,210,0.5)", backgroundColor: "rgba(42,31,21,0.6)" }}
      >
        {SHOP_CTA(character)} {">"}
      </a>
      <a
        href={IG_DM_URL}
        onClick={() => track("game_dm_click")}
        target="_blank"
        rel="noreferrer"
        className="w-full block text-[10px] text-center leading-relaxed py-3 px-3"
        style={{ border: "2px solid rgba(234,230,210,0.5)", backgroundColor: "rgba(42,31,21,0.6)" }}
      >
        {COACHING_CTA}
      </a>
    </Screen>
  );
}
