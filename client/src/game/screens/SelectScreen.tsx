import { CHARACTERS, type Character } from "@shared/game/types";
import { useEffect, useRef, useState } from "react";
import { sfx } from "../audio";
import { CHARACTER_INFO } from "../content";
import { poseUrl, type Pose } from "../poses";
import { ArcadeTitle, CREAM, Fighter, GOLD, PixelButton, Screen } from "./ui";

/** Mortal Kombat-style fighter select: big fighter on stage, portrait row below. */
export default function SelectScreen({
  onPick,
  onBack,
  starting,
}: {
  onPick: (c: Character) => void;
  onBack: () => void;
  starting: boolean;
}) {
  const [picked, setPicked] = useState<Character>("levi");
  const [pose, setPose] = useState<Pose>("stance");
  const [flashKey, setFlashKey] = useState(0);
  const [locked, setLocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const choose = (c: Character) => {
    if (locked) return;
    setPicked(c);
    setFlashKey((k) => k + 1);
    setPose("flex");
    sfx("good");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPose("stance"), 750);
  };

  const confirm = () => {
    if (locked || starting) return;
    setLocked(true);
    setPose("victory");
    setFlashKey((k) => k + 1);
    sfx("perfect");
    timer.current = setTimeout(() => onPick(picked), 700);
  };

  const info = CHARACTER_INFO[picked];

  return (
    <Screen dim={0.45}>
      <ArcadeTitle size={15} style={{ marginTop: 4 }}>
        CHOOSE YOUR FIGHTER
      </ArcadeTitle>

      {/* Stage: the selected fighter, big. */}
      <div className="relative w-full flex flex-col items-center justify-end" style={{ height: 300 }}>
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2"
          style={{ width: 200, height: 18, borderRadius: "50%", background: "radial-gradient(rgba(212,175,55,0.45), transparent 70%)" }}
        />
        <div key={`${picked}-${flashKey}`} style={{ animation: "lff-slide-in 0.25s ease-out both" }}>
          <Fighter id={picked} pose={pose} height={pose === "victory" ? 290 : 270} />
        </div>
        <div
          key={`flash-${flashKey}`}
          className="pointer-events-none absolute inset-0"
          style={{ background: "#fff", mixBlendMode: "overlay", animation: "lff-flash 0.35s ease-out forwards" }}
        />
      </div>

      {/* Name banner. */}
      <div key={picked} className="w-full text-center" style={{ animation: "lff-pop 0.3s ease-out both" }}>
        <ArcadeTitle size={22} colour={CREAM}>
          {info.name}
        </ArcadeTitle>
        <p className="text-[8px] leading-loose mt-1" style={{ color: GOLD, textShadow: "2px 2px 0 #000" }}>
          {info.tagline.toUpperCase()}
        </p>
      </div>

      {/* Portrait row. */}
      <div className="w-full grid grid-cols-4 gap-2">
        {CHARACTERS.map((c) => {
          const on = c === picked;
          return (
            <button
              key={c}
              onClick={() => choose(c)}
              aria-label={CHARACTER_INFO[c].name}
              className="relative overflow-hidden"
              style={{
                height: 84,
                backgroundColor: on ? "#2a1f12" : "rgba(0,0,0,0.6)",
                border: `3px solid ${on ? GOLD : "rgba(234,230,210,0.5)"}`,
                animation: on ? "lff-pulse 0.8s steps(2) infinite" : undefined,
              }}
            >
              <img
                src={poseUrl(c, "stance")}
                alt=""
                draggable={false}
                className="absolute left-1/2 -translate-x-1/2"
                style={{ top: 4, height: 200, width: "auto", maxWidth: "none", imageRendering: "pixelated", filter: on ? "none" : "grayscale(0.6) brightness(0.8)" }}
              />
              <span
                className="absolute bottom-0 inset-x-0 text-[6px] py-1"
                style={{ backgroundColor: "rgba(0,0,0,0.75)", color: on ? GOLD : CREAM }}
              >
                {CHARACTER_INFO[c].name}
              </span>
            </button>
          );
        })}
        <div
          className="flex flex-col items-center justify-center"
          style={{ height: 84, border: "3px dashed rgba(234,230,210,0.4)", backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <span className="text-xl" style={{ color: "rgba(234,230,210,0.5)" }}>?</span>
          <span className="text-[6px] mt-1 opacity-60">LOCKED</span>
        </div>
      </div>

      <PixelButton variant="gold" big onClick={confirm} disabled={starting || locked}>
        {starting || locked ? "LOADING PLATES..." : "LIFT!"}
      </PixelButton>
      <p className="text-[7px] opacity-70 text-center leading-loose">Same lifts, same rules. Pick your team.</p>
      <PixelButton variant="ghost" onClick={onBack}>
        BACK
      </PixelButton>
    </Screen>
  );
}
