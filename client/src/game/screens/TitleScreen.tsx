import { CHARACTERS, type Character } from "@shared/game/types";
import { useEffect, useState } from "react";
import { isMuted, jingle, setMuted } from "../audio";
import type { Pose } from "../poses";
import { BLUE, CREAM, Fighter, INK, PixelButton, Screen } from "./ui";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

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

  return (
    <Screen dim={0.35} bg="/game/gym_bg_plain.png">
      <div
        className="flex items-center justify-center px-6 py-3 mt-1"
        style={{ backgroundColor: "rgba(84,65,47,0.92)", border: `3px solid ${CREAM}`, boxShadow: `inset 0 0 0 3px ${INK}, 5px 5px 0 rgba(0,0,0,0.5)` }}
      >
        <img src={LOGO} alt="LFF" className="w-14" style={{ animation: "lff-pop 0.6s ease-out both" }} />
      </div>
      <p className="text-[8px] text-center leading-loose" style={{ color: CREAM, textShadow: `2px 2px 0 ${INK}` }}>
        BENCH · SQUAT · DEADLIFT
        <br />
        TOP SCORE ON <span style={{ color: BLUE }}>TEAM LFF</span> WINS A FREE TEE
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
        className="text-[9px] opacity-70 underline"
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
