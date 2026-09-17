import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT, BOX_SHADOW, SLAM } from "../theme";
import { BEATS } from "../timing";

const Item: React.FC<{ color: string; label: string; delay: number }> = ({ color, label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - BEATS.legend.in - delay, fps, config: SLAM });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "14px 30px 14px 20px",
        borderRadius: 999,
        background: "rgba(84, 65, 47, 0.92)",
        boxShadow: BOX_SHADOW,
        transform: `translateX(${(1 - s) * -160}px) scale(${0.85 + s * 0.15})`,
        opacity: Math.min(1, s * 1.6),
      }}
    >
      <div
        style={{
          width: 34, height: 34, borderRadius: 12, background: color,
          boxShadow: `0 0 20px ${color}`,
        }}
      />
      <span
        style={{
          fontFamily: FONT.display, fontWeight: 900, fontSize: 32,
          color: COLORS.cream, letterSpacing: 1.5, whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const Legend: React.FC = () => (
  <div
    style={{
      position: "absolute", top: 300, left: 150,
      display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start",
    }}
  >
    <Item color={COLORS.growth} label="GROWTH STIMULUS" delay={0} />
    <Item color={COLORS.fatigue} label="FATIGUE" delay={7} />
  </div>
);
