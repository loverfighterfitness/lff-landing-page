import React, { createContext, useContext, useMemo } from "react";
import { readableInk, withAlpha } from "./color";
import { EMBER } from "./palettes";

/** What components actually consume — every derived colour resolved once. */
export type ResolvedPalette = {
  growth: string;
  growthGlow: string;
  fatigue: string;
  fatigueGlow: string;
  band: string;
  bandSoft: string;
  /** Text on the band badge — follows the band's luminance. */
  bandInk: string;
  ink: string;
  inkDim: string;
  panel: string;
  glowStrength: number;
  curveWidth: number;
};

export const resolvePalette = (input: {
  growth: string;
  fatigue: string;
  band: string;
  ink: string;
  panel: string;
  glowStrength: number;
  bandFill: number;
  curveWidth: number;
}): ResolvedPalette => ({
  growth: input.growth,
  growthGlow: withAlpha(input.growth, 0.45),
  fatigue: input.fatigue,
  fatigueGlow: withAlpha(input.fatigue, 0.4),
  band: input.band,
  bandSoft: withAlpha(input.band, input.bandFill),
  bandInk: readableInk(input.band),
  ink: input.ink,
  inkDim: withAlpha(input.ink, 0.55),
  panel: withAlpha(input.panel, 0.92),
  glowStrength: input.glowStrength,
  curveWidth: input.curveWidth,
});

const FALLBACK = resolvePalette({ ...EMBER, curveWidth: 12 });

const PaletteContext = createContext<ResolvedPalette>(FALLBACK);

export const PaletteProvider: React.FC<{
  value: ResolvedPalette;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const memo = useMemo(() => value, [value]);
  return (
    <PaletteContext.Provider value={memo}>{children}</PaletteContext.Provider>
  );
};

export const usePalette = (): ResolvedPalette => useContext(PaletteContext);
