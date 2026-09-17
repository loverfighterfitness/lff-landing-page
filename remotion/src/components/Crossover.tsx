import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT, SLAM } from "../theme";
import { crossoverX, growth, sx, sy } from "../curves";
import { BEATS } from "../timing";

/**
 * Marks where fatigue overtakes growth stimulus, and X's out everything past it.
 * The crossover x is solved from the curves themselves, so it stays correct if
 * the dose-response constants are ever retuned.
 */
export const Crossover: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - BEATS.crossover.in;
  if (t < 0) return null;

  const pop = spring({ frame: t, fps, config: SLAM });
  const cx = sx(crossoverX);
  const cy = sy(growth(crossoverX));

  // Ring breathes after it lands so the eye keeps coming back to it.
  const pulse = 1 + 0.07 * Math.sin((t / fps) * Math.PI * 2 * 1.1);

  const xMark = spring({ frame: t - 20, fps, config: SLAM });
  const xCx = sx(12.9);
  const xCy = sy(0.72);
  const arm = 58;

  return (
    <g>
      <g transform={`translate(${cx} ${cy}) scale(${pop * pulse})`} opacity={Math.min(1, pop * 1.5)}>
        <circle r={54} fill="none" stroke={COLORS.fatigue} strokeWidth={7} />
        <circle r={54} fill="none" stroke={COLORS.fatigueGlow} strokeWidth={20} style={{ filter: "blur(8px)" }} />
      </g>

      {/* The dead zone past the crossover */}
      <g
        transform={`translate(${xCx} ${xCy}) scale(${xMark}) rotate(${interpolate(xMark, [0, 1], [-35, 0])})`}
        opacity={Math.min(1, xMark * 1.4)}
      >
        <line x1={-arm} y1={-arm} x2={arm} y2={arm} stroke={COLORS.fatigue} strokeWidth={22} strokeLinecap="round" />
        <line x1={arm} y1={-arm} x2={-arm} y2={arm} stroke={COLORS.fatigue} strokeWidth={22} strokeLinecap="round" />
      </g>
      <text
        x={xCx} y={xCy + 128}
        fill={COLORS.fatigue} fontFamily={FONT.display} fontSize={34} fontWeight={900}
        textAnchor="middle" letterSpacing={2}
        opacity={Math.min(1, Math.max(0, xMark * 1.4 - 0.3))}
        style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }}
      >
        JUNK
      </text>
    </g>
  );
};
