import { CHARACTERS, type Character } from "@shared/game/types";
import { useEffect, useRef, useState } from "react";
import { sfx } from "../audio";
import { useCompStatus } from "../compStatus";
import { CHARACTER_INFO, IG_DM_URL, NEXT_FIGHTER_BODY, NEXT_FIGHTER_TITLE } from "../content";
import { poseUrl, type Pose } from "../poses";
import { ArcadeTitle, BLUE, CREAM, Fighter, INK, Panel, PixelButton, Screen } from "./ui";

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
  const [teaser, setTeaser] = useState(false);
  const comp = useCompStatus();
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
      {!comp.open && (
        <p className="text-[8px] -mt-3" style={{ color: BLUE, textShadow: `2px 2px 0 ${INK}` }}>
          {comp.line}
        </p>
      )}

      {/* Stage: the selected fighter, big. */}
      <div className="relative w-full flex flex-col items-center justify-end" style={{ height: 300 }}>
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2"
          style={{ width: 200, height: 18, borderRadius: "50%", background: "radial-gradient(rgba(169,212,245,0.4), transparent 70%)" }}
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
        <p className="text-[8px] leading-loose mt-1" style={{ color: BLUE, textShadow: `2px 2px 0 ${INK}` }}>
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
                backgroundColor: on ? "#54412F" : "rgba(42,31,21,0.75)",
                border: `3px solid ${on ? BLUE : "rgba(234,230,210,0.5)"}`,
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
                className="absolute bottom-0 inset-x-0 text-[8px] py-1"
                style={{ backgroundColor: "rgba(42,31,21,0.85)", color: on ? BLUE : CREAM }}
              >
                {CHARACTER_INFO[c].name}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setTeaser(true)}
          className="flex flex-col items-center justify-center"
          style={{ height: 84, border: "3px dashed rgba(234,230,210,0.5)", backgroundColor: "rgba(42,31,21,0.75)" }}
        >
          <span className="text-xl" style={{ color: BLUE }}>?</span>
          <span className="text-[8px] mt-1" style={{ color: CREAM }}>YOU?</span>
        </button>
      </div>

      <PixelButton variant="gold" big onClick={confirm} disabled={starting || locked}>
        {starting || locked ? "LOADING PLATES..." : "LIFT!"}
      </PixelButton>
      <p className="text-[8px] opacity-70 text-center leading-loose">Same lifts, same rules. Pick your team.</p>
      <PixelButton variant="ghost" onClick={onBack}>
        BACK
      </PixelButton>

      {teaser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(20,14,9,0.85)" }} onClick={() => setTeaser(false)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()} style={{ animation: "lff-pop 0.25s ease-out both" }}>
            <Panel>
              <div className="flex flex-col items-center gap-4 text-center">
                <span className="text-3xl" style={{ color: BLUE }}>?</span>
                <ArcadeTitle size={13}>{NEXT_FIGHTER_TITLE}</ArcadeTitle>
                <p className="text-[10px] leading-loose">{NEXT_FIGHTER_BODY}</p>
                <a
                  href={IG_DM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full px-4 py-3 text-xs"
                  style={{ backgroundColor: CREAM, color: INK, border: `3px solid ${INK}`, boxShadow: `4px 4px 0 ${BLUE}` }}
                >
                  DM ME "TRANSFORM"
                </a>
                <button className="text-[10px] underline opacity-70" onClick={() => setTeaser(false)}>BACK TO SELECT</button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </Screen>
  );
}
