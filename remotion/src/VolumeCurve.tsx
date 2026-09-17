import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

import { CANVAS, GROWTH_PATH, FATIGUE_PATH } from "./curves";
import { BEATS } from "./timing";
import type { Palette } from "./palettes";
import { PaletteProvider, resolvePalette } from "./usePalette";
import { Axes } from "./components/Axes";
import { CurveLine } from "./components/CurveLine";
import { Legend } from "./components/Legend";
import { SweetSpotBand } from "./components/SweetSpotBand";
import { Crossover } from "./components/Crossover";
import { Caption } from "./components/Caption";
import { TitleCard } from "./components/TitleCard";
import "./fonts";

/**
 * Editable in Remotion Studio's right-hand panel. Only base hues are exposed —
 * glows, band fills and badge ink derive from them, so no combination of the
 * swatches can put the graphic into an inconsistent state.
 */
export const volumeCurveSchema = z.object({
  transparentBackground: z.boolean(),
  backgroundColor: zColor(),
  growthColor: zColor(),
  fatigueColor: zColor(),
  bandColor: zColor(),
  inkColor: zColor(),
  panelColor: zColor(),
  curveWidth: z.number().min(4).max(28),
  glowStrength: z.number().min(0).max(2),
  bandFill: z.number().min(0).max(0.6),
});

export type VolumeCurveProps = z.infer<typeof volumeCurveSchema>;

/** Every composition's defaults come from a palette — see palettes.ts. */
export const defaultsFor = (p: Palette): VolumeCurveProps => ({
  transparentBackground: true,
  backgroundColor: p.background,
  growthColor: p.growth,
  fatigueColor: p.fatigue,
  bandColor: p.band,
  inkColor: p.ink,
  panelColor: p.panel,
  curveWidth: 12,
  glowStrength: p.glowStrength,
  bandFill: p.bandFill,
});

export const VolumeCurve: React.FC<VolumeCurveProps> = props => {
  const {
    transparentBackground,
    backgroundColor,
    growthColor,
    fatigueColor,
    bandColor,
    inkColor,
    panelColor,
    curveWidth,
    glowStrength,
    bandFill,
  } = props;

  const pal = resolvePalette({
    growth: growthColor,
    fatigue: fatigueColor,
    band: bandColor,
    ink: inkColor,
    panel: panelColor,
    glowStrength,
    bandFill,
    curveWidth,
  });

  return (
    <PaletteProvider value={pal}>
      <AbsoluteFill
        style={{
          backgroundColor: transparentBackground ? undefined : backgroundColor,
        }}
      >
        <svg
          width={CANVAS.width}
          height={CANVAS.height}
          viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
          style={{ position: "absolute", inset: 0 }}
        >
          <Axes />
          <SweetSpotBand />
          <CurveLine
            path={GROWTH_PATH}
            color={pal.growth}
            glow={pal.growthGlow}
            startFrame={BEATS.growth.in}
            drawFrames={BEATS.growth.draw}
            strokeWidth={curveWidth}
          />
          <CurveLine
            path={FATIGUE_PATH}
            color={pal.fatigue}
            glow={pal.fatigueGlow}
            startFrame={BEATS.fatigue.in}
            drawFrames={BEATS.fatigue.draw}
            strokeWidth={curveWidth}
          />
          <Crossover />
        </svg>

        <Legend />
        <Caption />
        <TitleCard />
      </AbsoluteFill>
    </PaletteProvider>
  );
};
