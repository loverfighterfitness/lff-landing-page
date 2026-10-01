import { CHARACTERS, type Character } from "@shared/game/types";
import { useMemo, useState } from "react";
import { CHARACTER_INFO } from "../content";
import { hasGold } from "../gold";
import { spriteDataUrl } from "../sprites";
import { PixelButton, Screen } from "./ui";

export default function SelectScreen({
  onPick,
  onBack,
  starting,
}: {
  onPick: (c: Character, gold: boolean) => void;
  onBack: () => void;
  starting: boolean;
}) {
  const goldUnlocked = hasGold();
  const [gold, setGold] = useState(goldUnlocked);
  const [picked, setPicked] = useState<Character>("levi");
  const sprites = useMemo(
    () => Object.fromEntries(CHARACTERS.map((c) => [c, spriteDataUrl(c, gold, 4)])) as Record<Character, string>,
    [gold],
  );

  return (
    <Screen>
      <h2 className="text-sm mt-4">CHOOSE YOUR LIFTER</h2>
      <div className="grid grid-cols-2 gap-3 w-full">
        {CHARACTERS.map((c) => (
          <button
            key={c}
            onClick={() => setPicked(c)}
            className="flex flex-col items-center gap-2 p-3"
            style={{ border: `3px solid ${picked === c ? "#d4af37" : "#EAE6D2"}`, backgroundColor: picked === c ? "#2e2318" : "transparent" }}
          >
            <img src={sprites[c]} alt={CHARACTER_INFO[c].name} width={64} height={96} style={{ imageRendering: "pixelated" }} />
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
      {goldUnlocked && (
        <label className="flex items-center gap-2 text-[9px]">
          <input type="checkbox" checked={gold} onChange={(e) => setGold(e.target.checked)} />
          GOLD "COACHED BY LEVI" TEE
        </label>
      )}
      <p className="text-[8px] opacity-70 text-center leading-loose">Same lifts, same rules — pick your team.</p>
      <PixelButton onClick={() => onPick(picked, gold)} disabled={starting}>
        {starting ? "LOADING PLATES..." : `LIFT AS ${CHARACTER_INFO[picked].name}`}
      </PixelButton>
      <PixelButton variant="ghost" onClick={onBack}>
        BACK
      </PixelButton>
    </Screen>
  );
}
