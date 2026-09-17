import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

import { CANVAS, GROWTH_PATH, FATIGUE_PATH } from "./curves";
import { BEATS } from "./timing";
import { COLORS } from "./theme";
import { Axes } from "./components/Axes";
import { CurveLine } from "./components/CurveLine";
import { Legend } from "./components/Legend";
import { SweetSpotBand } from "./components/SweetSpotBand";
import { Crossover } from "./components/Crossover";
import { Caption } from "./components/Caption";
import { TitleCard } from "./components/TitleCard";
import "./fonts";

/**
 * Editable in Remotion Studio's right-hand panel — colour swatches for every
 * element, plus curve weight and the background switch. Beat timing lives in
 * timing.ts so the whole sequence can be retimed in one place.
 */
export const volumeCurveSchema = z.object({
  transparentBackground: z.boolean(),
  backgroundColor: zColor(),
  growthColor: zColor(),
  fatigueColor: zColor(),
  bandColor: zColor(),
  inkColor: zColor(),
  curveWidth: z.number().min(4).max(28),
});

export type VolumeCurveProps = z.infer<typeof volumeCurveSchema>;

export const volumeCurveDefaults: VolumeCurveProps = {
  transparentBackground: true,
  backgroundColor: "#171310",
  growthColor: COLORS.growth,
  fatigueColor: COLORS.fatigue,
  bandColor: COLORS.gold,
  inkColor: COLORS.cream,
  curveWidth: 12,
};

export const VolumeCurve: React.FC<VolumeCurveProps> = ({
  transparentBackground,
  backgroundColor,
  growthColor,
  fatigueColor,
  curveWidth,
}) => {
  return (
    <AbsoluteFill
      style={{ backgroundColor: transparentBackground ? undefined : backgroundColor }}
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
          color={growthColor}
          glow={COLORS.growthGlow}
          startFrame={BEATS.growth.in}
          drawFrames={BEATS.growth.draw}
          strokeWidth={curveWidth}
        />
        <CurveLine
          path={FATIGUE_PATH}
          color={fatigueColor}
          glow={COLORS.fatigueGlow}
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
  );
};
