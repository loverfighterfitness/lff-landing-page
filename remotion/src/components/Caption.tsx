import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT, TEXT_SHADOW, BOX_SHADOW, SLAM } from "../theme";
import { CAPTIONS } from "../timing";

/** The caption rail under the chart. One beat is on screen at a time. */
export const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const active = CAPTIONS.find((c) => frame >= c.in && frame < c.out);
  if (!active) return null;

  const t = frame - active.in;
  const enter = spring({ frame: t, fps, config: SLAM });
  const exit = interpolate(frame, [active.out - 12, active.out], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1390,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        padding: "0 60px",
        opacity: Math.min(1, enter * 1.6) * exit,
        transform: `translateY(${(1 - enter) * 60}px)`,
      }}
    >
      <div
        style={{
          padding: "10px 28px",
          borderRadius: 999,
          background: COLORS.brown,
          boxShadow: BOX_SHADOW,
          fontFamily: FONT.display,
          fontWeight: 900,
          fontSize: 30,
          letterSpacing: 3,
          color: COLORS.gold,
        }}
      >
        {active.kicker}
      </div>

      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 900,
          fontSize: 104,
          lineHeight: 1.02,
          letterSpacing: -1,
          color: COLORS.cream,
          textAlign: "center",
          textWrap: "balance",
          textShadow: TEXT_SHADOW,
        }}
      >
        {active.line}
      </div>

      <div
        style={{
          fontFamily: FONT.body,
          fontWeight: 600,
          fontSize: 38,
          lineHeight: 1.3,
          color: COLORS.creamDim,
          textAlign: "center",
          maxWidth: 820,
          textShadow: TEXT_SHADOW,
        }}
      >
        {active.sub}
      </div>
    </div>
  );
};
