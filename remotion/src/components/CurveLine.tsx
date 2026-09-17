import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import type { Path } from "../curves";

type Props = {
  path: Path;
  color: string;
  glow: string;
  startFrame: number;
  drawFrames: number;
  strokeWidth: number;
};

/**
 * Draws a sampled path on with a dash-offset wipe. The glow copy sits behind the
 * stroke so the line stays readable when the overlay is keyed over footage.
 */
export const CurveLine: React.FC<Props> = ({
  path, color, glow, startFrame, drawFrames, strokeWidth,
}) => {
  const frame = useCurrentFrame();
  const t = frame - startFrame;
  if (t < 0) return null;

  const progress = interpolate(t, [0, drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const offset = path.length * (1 - progress);

  return (
    <g>
      <path
        d={path.d} fill="none" stroke={glow} strokeWidth={strokeWidth + 16}
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={path.length} strokeDashoffset={offset}
        style={{ filter: "blur(10px)" }}
      />
      <path
        d={path.d} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={path.length} strokeDashoffset={offset}
      />
    </g>
  );
};
