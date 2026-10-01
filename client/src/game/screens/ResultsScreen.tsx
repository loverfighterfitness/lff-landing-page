import type { Character } from "@shared/game/types";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { trpc } from "@/lib/trpc";
import { jingle } from "../audio";
import type { CircuitResult } from "../CircuitCanvas";
import { CHARACTER_INFO, COACHING_CTA, IG_DM_URL, IG_PROFILE_URL, PRACTICE_LINE, RUBY_PODIUM_LINE, SHOP_CTA } from "../content";
import { renderScoreCard, shareScoreCard } from "../scoreCard";
import { BAD, BLUE } from "../theme";
import { ArcadeTitle, Fighter, Panel, PixelButton, Screen } from "./ui";

const SAVED_KEY = "lff-gym-entrant";

function loadSaved(): { handle: string; email: string } {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "") as { handle: string; email: string };
  } catch {
    return { handle: "", email: "" };
  }
}

export default function ResultsScreen({
  character,
  runId,
  eventOpen,
  result,
  onAgain,
  onPosted,
}: {
  character: Character;
  runId: string | null;
  eventOpen: boolean;
  result: CircuitResult;
  onAgain: () => void;
  onPosted: (handle: string) => void;
}) {
  const saved = loadSaved();
  const [handle, setHandle] = useState(saved.handle);
  const [email, setEmail] = useState(saved.email);
  const [optIn, setOptIn] = useState(false);
  const [error, setError] = useState("");
  const submit = trpc.game.submitRun.useMutation();
  const total = result.scores.bench + result.scores.squat + result.scores.deadlift;
  const info = CHARACTER_INFO[character];
  const quote = info.winQuotes[total % info.winQuotes.length];
  const [sharing, setSharing] = useState(false);
  const [newPb, setNewPb] = useState(false);

  useEffect(() => {
    track("game_finish", Math.min(86400, total));
    // Personal best (per device): play the LFF sting.
    try {
      const best = Number(localStorage.getItem("lff-gym-pb") ?? 0);
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

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runId) return;
    setError("");
    if (!/^[A-Za-z0-9._]{1,30}$/.test(handle.trim().replace(/^@/, ""))) {
      setError("Enter your Instagram handle (letters, numbers, . and _)");
      return;
    }
    try {
      await submit.mutateAsync({ runId, handle, email, marketingOptIn: optIn, logs: result.logs });
      track("game_post", Math.min(86400, total));
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify({ handle, email }));
      } catch {
        /* ignore */
      }
      onPosted(handle.trim().replace(/^@/, ""));
    } catch (err) {
      // Network failures keep the run here so the player can retry.
      const msg = err instanceof Error ? err.message : "";
      setError(msg && !msg.startsWith("[") && !msg.startsWith("{") ? msg : "Couldn't post your score. Check your handle and email.");
    }
  };

  const canPost = !!runId && eventOpen;

  return (
    <Screen>
      <ArcadeTitle size={16} style={{ marginTop: 4, animation: "lff-pop 0.4s ease-out both" }}>
        CIRCUIT COMPLETE
      </ArcadeTitle>
      <Fighter id={character} pose="victory" height={190} />
      {newPb && (
        <p className="text-[10px]" style={{ color: BLUE, animation: "lff-blink 0.6s steps(1) 6" }}>
          NEW PB
        </p>
      )}
      <p className="text-[9px] text-center leading-loose" style={{ textShadow: "2px 2px 0 #000" }}>"{quote}" - {info.name}</p>
      {character === "ruby" && result.perfects >= 8 && <p className="text-lg">{RUBY_PODIUM_LINE}</p>}
      <Panel>
      <div className="w-full flex flex-col gap-2 text-[10px]">
        <div className="flex justify-between"><span>BENCH</span><span>{result.scores.bench}</span></div>
        <div className="flex justify-between"><span>SQUATS</span><span>{result.scores.squat}</span></div>
        <div className="flex justify-between"><span>DEADLIFT</span><span>{result.scores.deadlift}</span></div>
        <div className="flex justify-between text-sm pt-2" style={{ borderTop: "2px solid #EAE6D2" }}>
          <span>TOTAL</span><span style={{ color: BLUE }}>{total}</span>
        </div>
      </div>
      </Panel>

      {canPost ? (
        <Panel>
        <form onSubmit={post} className="w-full flex flex-col gap-3 text-[9px]">
          <p className="leading-loose">Post your score. Top score when the comp closes wins a free tee.</p>
          <input
            required
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@instagram"
            className="w-full px-3 py-3 text-[10px]"
            style={{ backgroundColor: "#0d0b09", color: "#EAE6D2", border: "2px solid #EAE6D2", fontFamily: "inherit" }}
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email (private, only to contact the winner)"
            className="w-full px-3 py-3 text-[10px]"
            style={{ backgroundColor: "#0d0b09", color: "#EAE6D2", border: "2px solid #EAE6D2", fontFamily: "inherit" }}
          />
          <label className="flex items-start gap-2 leading-relaxed">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
            Send me LFF training tips and drops
          </label>
          {error && <p style={{ color: BAD }} className="leading-relaxed">{error}</p>}
          <PixelButton type="submit" disabled={submit.isPending}>
            {submit.isPending ? "POSTING..." : error ? "RETRY" : "POST SCORE"}
          </PixelButton>
        </form>
        </Panel>
      ) : (
        <p className="text-[9px] text-center leading-loose opacity-80">
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
        className="text-[9px] underline text-center leading-loose"
      >
        {SHOP_CTA(character)} {">"}
      </a>
      <a
        href={IG_DM_URL}
        onClick={() => track("game_dm_click")}
        target="_blank"
        rel="noreferrer"
        className="text-[9px] underline text-center leading-loose"
      >
        {COACHING_CTA}
      </a>
    </Screen>
  );
}
