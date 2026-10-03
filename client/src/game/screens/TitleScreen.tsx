import { CHARACTERS, type Character } from "@shared/game/types";
import { gameAsset } from "../theme";
import { useEffect, useState } from "react";
import { isMuted, jingle, setMuted } from "../audio";
import { useCompStatus } from "../compStatus";
import { YEAR_PRIZE } from "../content";
import { YEAR_PRIZE_KG } from "@shared/game/config";
import type { Pose } from "../poses";
import { BLUE, CREAM, Fighter, INK, PixelButton, Screen } from "./ui";

/** Every couple of seconds one lifter hits a flex or victory pose, then settles back. */
function useShowOff() {
  const [show, setShow] = useState<{ who: Character; pose: Pose } | null>(null);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      const who = CHARACTERS[i % CHARACTERS.length];
      setShow({ who, pose: i % 2 ? "victory" : "flex" });
      i++;
      setTimeout(() => setShow(null), 1100);
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return show;
}

/** Big live countdown to the end of the comp: the urgency is the point. */
function Countdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, endsAt - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const sec = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1" style={{ marginTop: -8 }}>
      <span className="text-[8px]" style={{ color: CREAM, textShadow: `2px 2px 0 ${INK}` }}>
        COMP ENDS IN
      </span>
      <span className="text-base" style={{ color: BLUE, textShadow: `2px 2px 0 ${INK}`, letterSpacing: 1 }}>
        {d > 0 ? `${d}D ` : ""}
        {pad(h)}:{pad(m)}:{pad(sec)}
      </span>
    </div>
  );
}

export default function TitleScreen({ onPlay, onBoard }: { onPlay: () => void; onBoard: () => void }) {
  const [muted, setMutedState] = useState(isMuted());
  const show = useShowOff();
  const comp = useCompStatus();

  return (
    <Screen dim={0.35} bg={gameAsset("gym_bg_plain.png")}>
      {/* The 3D wall sign from the in-game gym, so the logo reads as part of the gym. */}
      <img
        src={gameAsset("wall_logo.png")}
        alt="LFF Lover Fighter fitness"
        className="mt-1"
        style={{ width: 150, height: "auto", imageRendering: "pixelated", animation: "lff-pop 0.6s ease-out both" }}
      />
      <p className="text-[10px] text-center leading-loose" style={{ color: CREAM, textShadow: `2px 2px 0 ${INK}` }}>
        BENCH · SQUAT · DEADLIFT
        <br />
        <span className="text-[8px]">
          {comp.open ? (
            <>
              HEAVIEST TOTAL ON <span style={{ color: BLUE }}>TEAM LFF</span> WINS A FREE TEE
            </>
          ) : (
            <span style={{ color: BLUE }}>{comp.line}</span>
          )}
        </span>
      </p>
      {comp.endsAt && <Countdown endsAt={comp.endsAt} />}
      <p
        className="text-[8px] text-center leading-loose px-3 py-1"
        style={{ color: CREAM, backgroundColor: "rgba(42,31,21,0.85)", border: `2px solid ${BLUE}`, marginTop: -6 }}
      >
        {YEAR_PRIZE.claimedBy ? (
          <>YEAR OF COACHING CLAIMED BY <span style={{ color: BLUE }}>@{YEAR_PRIZE.claimedBy}</span></>
        ) : (
          <>FIRST TO <span style={{ color: BLUE }}>{YEAR_PRIZE_KG}KG</span> WINS A <span style={{ color: BLUE }}>YEAR OF COACHING</span></>
        )}
      </p>

      {/* The roster on stage, overlapping like a fighting-game line-up (coach in front). */}
      <div className="w-full flex items-end justify-center" style={{ height: 290 }}>
        {(["ruby", "levi", "benny"] as const).map((c, i) => (
          <div key={c} style={{ margin: "0 -22px", zIndex: c === "levi" ? 2 : 1, position: "relative" }}>
            <Fighter
              id={c}
              pose={show?.who === c ? show.pose : "stance"}
              height={c === "levi" ? 280 : 255}
              delay={i * 0.35}
              flip={c === "benny"}
            />
          </div>
        ))}
      </div>

      <PixelButton
        variant="gold"
        big
        onClick={() => {
          jingle();
          onPlay();
        }}
      >
        <span style={{ animation: "lff-blink 1s steps(1) infinite" }}>PRESS START</span>
      </PixelButton>
      <PixelButton variant="ghost" onClick={onBoard}>
        LEADERBOARD
      </PixelButton>
      <button
        className="text-[10px] opacity-70 underline"
        onClick={() => {
          setMuted(!muted);
          setMutedState(!muted);
        }}
      >
        SOUND: {muted ? "OFF" : "ON"}
      </button>
    </Screen>
  );
}
