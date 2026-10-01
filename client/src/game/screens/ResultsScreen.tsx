import type { Character } from "@shared/game/types";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { CircuitResult } from "../CircuitCanvas";
import { CHARACTER_INFO, COACHING_CTA, IG_DM_URL, RUBY_PODIUM_LINE, SHOP_CTA } from "../content";
import { PixelButton, Screen } from "./ui";

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
      <h2 className="text-sm mt-4" style={{ color: "#d4af37" }}>CIRCUIT COMPLETE</h2>
      <p className="text-[10px] text-center leading-loose">"{quote}" - {info.name}</p>
      {character === "ruby" && result.perfects >= 8 && <p className="text-lg">{RUBY_PODIUM_LINE}</p>}
      <div className="w-full flex flex-col gap-2 text-[10px]">
        <div className="flex justify-between"><span>BENCH</span><span>{result.scores.bench}</span></div>
        <div className="flex justify-between"><span>SQUATS</span><span>{result.scores.squat}</span></div>
        <div className="flex justify-between"><span>DEADLIFT</span><span>{result.scores.deadlift}</span></div>
        <div className="flex justify-between text-sm pt-2" style={{ borderTop: "2px solid #EAE6D2" }}>
          <span>TOTAL</span><span>{total}</span>
        </div>
      </div>

      {canPost ? (
        <form onSubmit={post} className="w-full flex flex-col gap-3 text-[9px]">
          <p className="leading-loose">Post your score. Top score when the comp closes wins a free tee.</p>
          <input
            required
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@instagram"
            className="w-full px-3 py-3 text-[10px]"
            style={{ backgroundColor: "#2e2318", color: "#EAE6D2", border: "2px solid #EAE6D2", fontFamily: "inherit" }}
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email (private, only to contact the winner)"
            className="w-full px-3 py-3 text-[10px]"
            style={{ backgroundColor: "#2e2318", color: "#EAE6D2", border: "2px solid #EAE6D2", fontFamily: "inherit" }}
          />
          <label className="flex items-start gap-2 leading-relaxed">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
            Send me LFF training tips and drops
          </label>
          {error && <p style={{ color: "#ff8a7a" }} className="leading-relaxed">{error}</p>}
          <PixelButton type="submit" disabled={submit.isPending}>
            {submit.isPending ? "POSTING..." : error ? "RETRY" : "POST SCORE"}
          </PixelButton>
        </form>
      ) : (
        <p className="text-[9px] text-center leading-loose opacity-80">
          {runId ? "The comp isn't open right now, this one's for practice." : "Practice run — scores can't be posted right now."}
        </p>
      )}

      <PixelButton variant={canPost ? "ghost" : "cream"} onClick={onAgain}>RUN IT BACK</PixelButton>
      <a href="/shop" className="text-[9px] underline text-center leading-loose">{SHOP_CTA(character)} {">"}</a>
      <a href={IG_DM_URL} target="_blank" rel="noreferrer" className="text-[9px] underline text-center leading-loose">
        {COACHING_CTA}
      </a>
    </Screen>
  );
}
