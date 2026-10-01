import { CHARACTERS, type Character } from "@shared/game/types";
import { gameAsset } from "../theme";
import { useEffect, useState } from "react";
import { isMuted, jingle, setMuted } from "../audio";
import { useCompStatus } from "../compStatus";
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

export default function TitleScreen({ onPlay, onBoard }: { onPlay: () => void; onBoard: () => void }) {
  const [muted, setMutedState] = useState(isMuted());
  const show = useShowOff();
  const comp = useCompStatus();

  return (
    <Screen dim={0.35} bg={gameAsset("gym_bg_plain.png")}>
      {/* The gym-wall banner (same art as the in-game wall), so the logo reads as part of the gym. */}
      <img
        src={gameAsset("wall_banner.png")}
        alt="LFF Lover Fighter fitness"
        className="mt-1"
        style={{ width: 152, height: "auto", imageRendering: "pixelated", filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.45))", animation: "lff-pop 0.6s ease-out both" }}
      />
      <p className="text-[10px] text-center leading-loose" style={{ color: CREAM, textShadow: `2px 2px 0 ${INK}` }}>
        BENCH · SQUAT · DEADLIFT
        <br />
        <span className="text-[8px]">
          {comp.open ? (
            <>
              HEAVIEST TOTAL ON <span style={{ color: BLUE }}>TEAM LFF</span> WINS A FREE TEE
              <br />
              {comp.line}
            </>
          ) : (
            <span style={{ color: BLUE }}>{comp.line}</span>
          )}
        </span>
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
