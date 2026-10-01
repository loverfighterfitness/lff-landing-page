import { useState } from "react";
import { isMuted, setMuted } from "../audio";
import { PixelButton, Screen } from "./ui";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

export default function TitleScreen({ onPlay, onBoard }: { onPlay: () => void; onBoard: () => void }) {
  const [muted, setMutedState] = useState(isMuted());

  return (
    <Screen>
      <img
        src={LOGO}
        alt="LFF"
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
