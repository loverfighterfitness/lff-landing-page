import { CHARACTERS, type Character } from "@shared/game/types";
import { useEffect, useState } from "react";
import { isMuted, setMuted } from "../audio";
import type { Pose } from "../poses";
import { ArcadeTitle, CREAM, Fighter, PixelButton, Screen } from "./ui";

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
    <Screen dim={0.35}>
      <img src={LOGO} alt="LFF" className="w-28 mt-2" style={{ animation: "lff-pop 0.6s ease-out both" }} />
      <ArcadeTitle size={22} style={{ animation: "lff-pop 0.6s 0.15s ease-out both" }}>
        LFF GYM
      </ArcadeTitle>
      <p className="text-[8px] text-center leading-loose" style={{ color: CREAM, textShadow: "2px 2px 0 #000" }}>
        BENCH · SQUAT · DEADLIFT
        <br />
        TOP SCORE WINS A FREE LFF TEE
      </p>

      {/* The roster on stage. */}
      <div className="w-full flex items-end justify-center gap-1 mt-2" style={{ height: 210 }}>
        {(["ruby", "levi", "benny"] as const).map((c, i) => (
          <Fighter
            key={c}
            id={c}
            pose={show?.who === c ? show.pose : "stance"}
            height={c === "levi" ? 200 : 186}
            delay={i * 0.35}
            flip={c === "benny"}
          />
        ))}
      </div>

      <PixelButton variant="gold" big onClick={onPlay}>
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
