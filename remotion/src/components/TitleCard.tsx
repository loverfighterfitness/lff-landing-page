import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT, TEXT_SHADOW, BOX_SHADOW, SLAM } from "../theme";
import { BEATS } from "../timing";

/** Opening slam. Clears out before the chart starts drawing. */
export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame >= BEATS.title.out) return null;

  const a = spring({ frame, fps, config: SLAM });
  const b = spring({ frame: frame - 8, fps, config: SLAM });
  const out = interpolate(frame, [BEATS.title.out - 14, BEATS.title.out], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        opacity: out,
      }}
    >
      <div
        style={{
          padding: "14px 36px",
          borderRadius: 999,
          background: COLORS.gold,
          boxShadow: BOX_SHADOW,
          fontFamily: FONT.display,
          fontWeight: 900,
          fontSize: 32,
          letterSpacing: 4,
          color: "#2A2018",
          transform: `translateY(${(1 - a) * -70}px) scale(${0.8 + a * 0.2})`,
        }}
      >
        VOLUME, HONESTLY
      </div>

      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 900,
          fontSize: 132,
          lineHeight: 0.98,
          letterSpacing: -3,
          color: COLORS.cream,
          textAlign: "center",
          textWrap: "balance",
          textShadow: TEXT_SHADOW,
          padding: "0 60px",
          transform: `translateY(${(1 - b) * 80}px) scale(${0.86 + b * 0.14})`,
        }}
      >
        GROWTH <span style={{ color: COLORS.growth }}>STIMULUS</span>
        <br />
        VS <span style={{ color: COLORS.fatigue }}>FATIGUE</span>
      </div>
    </div>
  );
};
