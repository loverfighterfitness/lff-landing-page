import type { Character } from "@shared/game/types";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { jingle } from "../audio";
import type { CircuitResult } from "../CircuitCanvas";
import { CHARACTER_INFO, IG_DM_URL, IG_PROFILE_URL, PRIZE, RUBY_PODIUM_LINE, YEAR_PRIZE } from "../content";
import { YEAR_PRIZE_KG } from "@shared/game/config";
import { renderScoreCard, shareScoreCard } from "../scoreCard";
import { BAD, BLUE, BROWN, CREAM, INK } from "../theme";
import ScratchTicket from "./ScratchTicket";
import { ArcadeTitle, Fighter, PixelButton, Screen } from "./ui";

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
    <Screen fit>
      {/* Header: the result and one-line statuses. */}
      <div className="w-full flex flex-col items-center gap-1 text-center">
        <ArcadeTitle size={12} style={{ animation: "lff-pop 0.4s ease-out both" }}>CIRCUIT COMPLETE</ArcadeTitle>
        <p className="text-2xl" style={{ color: BLUE, textShadow: `3px 3px 0 ${INK}` }}>{total}KG</p>
        <p className={small} style={shadow}>
          B {result.scores.bench} · S {result.scores.squat} · D {result.scores.deadlift}
          {newPb ? (
            <span style={{ color: BLUE, animation: "lff-blink 0.6s steps(1) 6" }}> · NEW PB{prevBest > 0 ? ` +${total - prevBest}` : ""}</span>
          ) : prevBest > total ? (
            <> · PB {prevBest}</>
          ) : null}
        </p>
        <p className={small} style={shadow}>
          {canPost ? (
            posted ? (
              <>
                @{handle}
                {posted.rank ? <> · <span style={{ color: BLUE }}>RANK #{posted.rank}</span></> : " · POSTED"}
              </>
            ) : error ? (
              <span style={{ color: BAD }}>
                {error}{" "}
                <button type="button" className="underline" style={{ color: CREAM }} onClick={() => void post()} disabled={submit.isPending}>
                  {submit.isPending ? "POSTING..." : "RETRY"}
                </button>
              </span>
            ) : (
              <>POSTING AS @{handle}...</>
            )
          ) : (
            <>PRACTICE RUN</>
          )}
          {!YEAR_PRIZE.claimedBy && total < YEAR_PRIZE_KG && (
            <> · <span style={{ color: BLUE }}>{YEAR_PRIZE_KG - total}KG</span> TO A YEAR FREE</>
          )}
        </p>
        {!YEAR_PRIZE.claimedBy && total >= YEAR_PRIZE_KG && (
          <a href={IG_DM_URL} target="_blank" rel="noreferrer" onClick={() => track("game_year_prize_claim")} className="text-[9px] underline" style={{ color: BLUE }}>
            {YEAR_PRIZE_KG}KG CLUB! DM "YEAR" TO CLAIM A YEAR OF COACHING (VERIFIED)
          </a>
        )}
      </div>

      {/* Middle (takes the leftover height): the scratchie beside the fighter holding it out. */}
      <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
        {prizeLive ? (
          <>
            <Fighter id={character} pose="handover" height="min(170px, 22dvh)" bob={false} style={{ animation: "lff-cheer 0.9s ease-out 0.2s 2 both" }} />
            <div className="w-full flex flex-col items-stretch gap-2" style={{ animation: "lff-handover 0.9s cubic-bezier(.2,.8,.3,1.2) 0.7s both" }}>
              <ScratchTicket onRevealed={() => { setScratched(true); track("game_prize_scratch"); }}>
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-[7px] tracking-widest" style={{ color: BROWN }}>LFF SCRATCHIE</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: INK }}>HALF-PRICE FIRST MONTH</p>
                  <p className="text-[8px] leading-relaxed" style={{ color: BROWN }}>LFF ONLINE COACHING</p>
                  <p className="text-[9px]">CODE <span className="text-sm" style={{ color: "#4F82AE" }}>{PRIZE.code}</span></p>
                </div>
              </ScratchTicket>
              {scratched ? (
                <a
                  href={PRIZE.url}
                  onClick={() => track("game_prize_claim")}
                  className="block text-center text-[10px] py-3"
                  style={{ backgroundColor: CREAM, color: INK, boxShadow: `3px 3px 0 ${BLUE}`, animation: "lff-pop 0.4s ease-out both" }}
                >
                  {PRIZE.cta}
                </a>
              ) : (
                <p className="text-[8px] text-center leading-relaxed" style={shadow}>{info.name} HANDS YOU A SCRATCHIE</p>
              )}
              <p className="text-[7px] text-center opacity-70">{PRIZE.fine}</p>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <Fighter id={character} pose="victory" height="min(220px, 85%)" bob={false} style={{ animation: "lff-cheer 0.9s ease-out 0.2s 2 both" }} />
            <p className={small} style={shadow}>"{quote}" - {info.name}</p>
            {character === "ruby" && result.perfects >= 8 && <p className="text-lg">{RUBY_PODIUM_LINE}</p>}
          </div>
        )}
      </div>

      {/* Actions, always on screen. */}
      <div className="w-full flex flex-col gap-2">
        <PixelButton variant="gold" onClick={onAgain}>RUN IT BACK</PixelButton>
        <div className="w-full grid grid-cols-2 gap-2">
          <PixelButton onClick={share} disabled={sharing}>{sharing ? "MAKING..." : "SHARE"}</PixelButton>
          <PixelButton variant="ghost" onClick={() => onPosted(handle, posted?.rank ?? null)}>LEADERBOARD</PixelButton>
        </div>
        <p className="text-[7px] text-center leading-relaxed opacity-80" style={shadow}>
          <a href={`/shop?tee=${info.tee}`} onClick={() => track(`game_shop_click:${info.tee}`)} className="underline">
            SHOP THE {info.tee.toUpperCase()} TEE
          </a>
          {" · "}
          <a href={IG_DM_URL} onClick={() => track("game_dm_click")} target="_blank" rel="noreferrer" className="underline">
            DM 'TRANSFORM' FOR COACHING
          </a>
          {!canPost && (
            <>
              {" · "}
              <a href={IG_PROFILE_URL} target="_blank" rel="noreferrer" className="underline">FOLLOW FOR THE NEXT COMP</a>
            </>
          )}
        </p>
      </div>
    </Screen>
  );
}
