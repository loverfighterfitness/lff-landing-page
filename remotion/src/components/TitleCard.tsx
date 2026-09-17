import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, TEXT_SHADOW, BOX_SHADOW, SLAM } from "../theme";
import { usePalette } from "../usePalette";
import { BEATS } from "../timing";

/** Opening slam. Clears out before the chart starts drawing. */
export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pal = usePalette();
  if (frame >= BEATS.title.out) return null;

  const a = spring({ frame, fps, config: SLAM });
  const b = spring({ frame: frame - 8, fps, config: SLAM });
  const out = interpolate(
    frame,
    [BEATS.title.out - 14, BEATS.title.out],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

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
          background: pal.band,
          boxShadow: BOX_SHADOW,
          fontFamily: FONT.display,
          fontWeight: 900,
          fontSize: 32,
          letterSpacing: 4,
          color: pal.bandInk,
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
          color: pal.ink,
          textAlign: "center",
          textWrap: "balance",
          textShadow: TEXT_SHADOW,
          padding: "0 60px",
          transform: `translateY(${(1 - b) * 80}px) scale(${0.86 + b * 0.14})`,
        }}
      >
        GROWTH <span style={{ color: pal.growth }}>STIMULUS</span>
        <br />
        VS <span style={{ color: pal.fatigue }}>FATIGUE</span>
      </div>
    </div>
  );
};
