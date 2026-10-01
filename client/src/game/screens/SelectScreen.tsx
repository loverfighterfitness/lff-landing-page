import { CHARACTERS, type Character } from "@shared/game/types";
import { useState } from "react";
import { CHARACTER_INFO } from "../content";
import { poseUrl } from "../poses";
import { PixelButton, Screen } from "./ui";

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

  return (
    <Screen>
      <h2 className="text-sm mt-4">CHOOSE YOUR LIFTER</h2>
      <div className="grid grid-cols-2 gap-3 w-full">
        {CHARACTERS.map((c) => (
          <button
            key={c}
            onClick={() => setPicked(c)}
            className="flex flex-col items-center gap-2 p-3"
            style={{ border: `3px solid ${picked === c ? "#d4af37" : "#EAE6D2"}`, backgroundColor: picked === c ? "#1f170f" : "#2e2318" }}
          >
            <img src={poseUrl(c, "idle")} alt={CHARACTER_INFO[c].name} style={{ imageRendering: "pixelated", height: 144, width: "auto" }} />
            <span className="text-[10px]">{CHARACTER_INFO[c].name}</span>
            <span className="text-[7px] leading-relaxed opacity-75 text-center">{CHARACTER_INFO[c].tagline}</span>
          </button>
        ))}
        <div className="flex flex-col items-center justify-center gap-2 p-3 opacity-50" style={{ border: "3px dashed #EAE6D2" }}>
          <span className="text-2xl">?</span>
          <span className="text-[10px]">???</span>
          <span className="text-[7px]">COMING SOON</span>
        </div>
      </div>
      <p className="text-[8px] opacity-70 text-center leading-loose">Same lifts, same rules — pick your team.</p>
      <PixelButton onClick={() => onPick(picked)} disabled={starting}>
        {starting ? "LOADING PLATES..." : `LIFT AS ${CHARACTER_INFO[picked].name}`}
      </PixelButton>
      <PixelButton variant="ghost" onClick={onBack}>
        BACK
      </PixelButton>
    </Screen>
  );
}
