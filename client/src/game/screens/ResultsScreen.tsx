import type { Character } from "@shared/game/types";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { jingle } from "../audio";
import type { CircuitResult } from "../CircuitCanvas";
import { CHARACTER_INFO, COACHING_CTA, IG_DM_URL, IG_PROFILE_URL, PRACTICE_LINE, PRIZE, RUBY_PODIUM_LINE, SHOP_CTA, YEAR_PRIZE } from "../content";
import { YEAR_PRIZE_KG } from "@shared/game/config";
import { renderScoreCard, shareScoreCard } from "../scoreCard";
import { BAD, BLUE, BROWN, CREAM, INK } from "../theme";
import ScratchTicket from "./ScratchTicket";
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
  const prizeLive = Date.now() < PRIZE.endsAt.getTime();
  const [scratched, setScratched] = useState(false);
  const small = "text-[9px] text-center leading-loose";
  const shadow = { textShadow: "2px 2px 0 #000" };

  return (
    <Screen>
      <ArcadeTitle size={16} style={{ marginTop: 4, animation: "lff-pop 0.4s ease-out both" }}>
        CIRCUIT COMPLETE
      </ArcadeTitle>

      {/* The result, in one place: total, the three lifts, then one line each for post / PB / the 800 chase. */}
      <div className="w-full flex flex-col items-center gap-1 -mt-2">
        <p className="text-3xl" style={{ color: BLUE, textShadow: `3px 3px 0 ${INK}` }}>{total}KG</p>
        <p className={small} style={shadow}>
          BENCH {result.scores.bench} · SQUAT {result.scores.squat} · DEADLIFT {result.scores.deadlift}
        </p>
        {canPost ? (
          posted ? (
            <p className={small} style={shadow}>
              POSTED AS <span style={{ color: BLUE }}>@{handle}</span>
              {posted.rank ? <> · <span style={{ color: BLUE }}>RANK #{posted.rank}</span></> : null}
            </p>
          ) : error ? (
            <p className={small} style={{ ...shadow, color: BAD }}>
              {error}{" "}
              <button type="button" className="underline" style={{ color: CREAM }} onClick={() => void post()} disabled={submit.isPending}>
                {submit.isPending ? "POSTING..." : "RETRY"}
              </button>
            </p>
          ) : (
            <p className={small} style={shadow}>POSTING AS <span style={{ color: BLUE }}>@{handle}</span>...</p>
          )
        ) : (
          <p className={small} style={{ ...shadow, opacity: 0.85 }}>PRACTICE RUN · NOT ON THE LEADERBOARD</p>
        )}
        {newPb ? (
          <p className={small} style={{ color: BLUE, animation: "lff-blink 0.6s steps(1) 6" }}>
            NEW PB{prevBest > 0 ? ` · +${total - prevBest}KG` : ""}
          </p>
        ) : prevBest > total ? (
          <p className={small} style={shadow}>{prevBest - total}KG OFF YOUR PB ({prevBest}KG)</p>
        ) : null}
        {!YEAR_PRIZE.claimedBy && total < YEAR_PRIZE_KG && (
          <p className={small} style={shadow}>
            <span style={{ color: BLUE }}>{YEAR_PRIZE_KG - total}KG</span> OFF A YEAR OF FREE COACHING
          </p>
        )}
      </div>

      {/* The fighter steps up holding out a scratchie (it then flies out of their hand, below). */}
      <div className="w-full flex flex-col items-center">
        <Fighter id={character} pose={prizeLive ? "handover" : "victory"} height={prizeLive ? 195 : 170} bob={false} style={{ animation: "lff-cheer 0.9s ease-out 0.2s 2 both" }} />
        <p className={small} style={{ ...shadow, marginTop: 4 }}>"{quote}" - {info.name}</p>
        {character === "ruby" && result.perfects >= 8 && <p className="text-lg">{RUBY_PODIUM_LINE}</p>}
      </div>

      {!YEAR_PRIZE.claimedBy && total >= YEAR_PRIZE_KG && (
        <Panel>
          <div className="w-full flex flex-col items-center gap-3 text-center text-[10px] leading-loose">
            <p className="text-sm" style={{ color: BLUE, animation: "lff-blink 0.6s steps(1) 8" }}>{YEAR_PRIZE_KG}KG CLUB!</p>
            <p>First verified lifter to {YEAR_PRIZE_KG}kg wins a year of coaching. DM "YEAR" now. We'll verify with a screen recording or a live rerun.</p>
            <a
              href={IG_DM_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("game_year_prize_claim")}
              className="w-full block text-xs py-3"
              style={{ backgroundColor: CREAM, color: INK, boxShadow: `4px 4px 0 ${BLUE}` }}
            >
              DM "YEAR" TO CLAIM
            </a>
          </div>
        </Panel>
      )}

      {prizeLive && (
        <div className="w-full flex flex-col items-center gap-3" style={{ animation: "lff-handover 0.9s cubic-bezier(.2,.8,.3,1.2) 0.7s both" }}>
          <p className="text-[10px]" style={{ ...shadow, color: CREAM }}>{info.name} HANDS YOU A SCRATCHIE</p>
          <ScratchTicket onRevealed={() => { setScratched(true); track("game_prize_scratch"); }}>
            <div className="flex flex-col items-center gap-2 text-center" style={{ fontFamily: "inherit" }}>
              <p className="text-[8px] tracking-widest" style={{ color: BROWN }}>LFF SCRATCHIE · EVERY LIFTER WINS</p>
              <p className="text-sm leading-relaxed" style={{ color: INK }}>HALF-PRICE FIRST MONTH</p>
              <p className="text-[9px]" style={{ color: BROWN }}>OF LFF ONLINE COACHING</p>
              <p className="text-[10px]">CODE <span className="text-base" style={{ color: "#4F82AE" }}>{PRIZE.code}</span></p>
            </div>
          </ScratchTicket>
          {scratched && (
            <>
              <a
                href={PRIZE.url}
                onClick={() => track("game_prize_claim")}
                className="w-full block text-center text-xs py-4"
                style={{ backgroundColor: CREAM, color: INK, boxShadow: `4px 4px 0 ${BLUE}`, animation: "lff-pop 0.4s ease-out both" }}
              >
                {PRIZE.cta}
              </a>
              <p className="text-[8px] opacity-70">{PRIZE.fine}</p>
            </>
          )}
        </div>
      )}

      {/* Actions: one big, two small. */}
      <PixelButton variant="gold" big onClick={onAgain}>RUN IT BACK</PixelButton>
      <div className="w-full grid grid-cols-2 gap-3">
        <PixelButton onClick={share} disabled={sharing}>{sharing ? "MAKING..." : "SHARE"}</PixelButton>
        <PixelButton variant="ghost" onClick={() => onPosted(handle, posted?.rank ?? null)}>LEADERBOARD</PixelButton>
      </div>

      <div className="w-full flex flex-col items-center gap-2 text-[8px] text-center leading-relaxed opacity-80" style={shadow}>
        <a href={`/shop?tee=${info.tee}`} onClick={() => track(`game_shop_click:${info.tee}`)} className="underline">
          {SHOP_CTA(character)} {">"}
        </a>
        <a href={IG_DM_URL} onClick={() => track("game_dm_click")} target="_blank" rel="noreferrer" className="underline">
          {COACHING_CTA}
        </a>
        {!canPost && (
          <a href={IG_PROFILE_URL} target="_blank" rel="noreferrer" className="underline">
            {PRACTICE_LINE}
          </a>
        )}
      </div>
    </Screen>
  );
}
