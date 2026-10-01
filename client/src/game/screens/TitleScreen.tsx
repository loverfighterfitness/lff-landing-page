import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CHEAT_CODE } from "../content";
import { hasGold, unlockGold } from "../gold";
import { isMuted, setMuted } from "../audio";
import { PixelButton, Screen } from "./ui";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

export default function TitleScreen({ onPlay, onBoard }: { onPlay: () => void; onBoard: () => void }) {
  const [muted, setMutedState] = useState(isMuted());
  const typed = useRef("");
  const logoTaps = useRef(0);

  const tryUnlock = (code: string) => {
    if (code.toUpperCase() !== CHEAT_CODE) return false;
    if (!hasGold()) unlockGold();
    toast.success("GOLD UNLOCKED — Coached by Levi 🤎");
    return true;
  };

  // Desktop: type TRANSFORM anywhere on the title screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      typed.current = (typed.current + e.key.toUpperCase()).slice(-CHEAT_CODE.length);
      if (typed.current === CHEAT_CODE) tryUnlock(typed.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Phones: tap the logo 5 times to enter a code.
  const tapLogo = () => {
    logoTaps.current++;
    if (logoTaps.current < 5) return;
    logoTaps.current = 0;
    const code = window.prompt("Enter code");
    if (code && !tryUnlock(code.trim())) toast("Nope. Coaching's the only cheat code.");
  };

  return (
    <Screen>
      <img
        src={LOGO}
        alt="LFF"
        onClick={tapLogo}
        className="w-40 mt-6"
        style={{ imageRendering: "pixelated", filter: "contrast(1.2)" }}
      />
      <h1 className="text-xl text-center leading-relaxed">LFF GYM</h1>
      <p className="text-[10px] text-center leading-loose opacity-80">
        Bench. Squat. Deadlift. One circuit.
        <br />
        Top score wins a free LFF tee.
      </p>
      <PixelButton onClick={onPlay}>PRESS START</PixelButton>
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
