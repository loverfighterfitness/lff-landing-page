import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT } from "../theme";
import { PLOT, X_TICKS, sx, sy, Y_DOMAIN } from "../curves";
import { BEATS } from "../timing";

/** Y-axis ticks are unlabelled on purpose — "amount" is qualitative, as on the board. */
const Y_TICK_VALUES = Array.from({ length: 9 }, (_, i) => (i + 1) * (Y_DOMAIN[1] / 10));

export const Axes: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - BEATS.axes.in;

  // Axes wipe out from the origin: y first, then x.
  const yGrow = interpolate(t, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const xGrow = interpolate(t, [12, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tickFade = interpolate(t, [30, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const labelFade = interpolate(t, [40, 62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  if (t < 0) return null;

  const yTop = PLOT.bottom - (PLOT.bottom - PLOT.top) * yGrow;
  const xRight = PLOT.left + (PLOT.right - PLOT.left) * xGrow;

  return (
    <g>
      {/* Axis lines */}
      <line
        x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.left} y2={yTop}
        stroke={COLORS.cream} strokeWidth={6} strokeLinecap="round"
      />
      <line
        x1={PLOT.left} y1={PLOT.bottom} x2={xRight} y2={PLOT.bottom}
        stroke={COLORS.cream} strokeWidth={6} strokeLinecap="round"
      />

      {/* Y ticks */}
      <g opacity={tickFade}>
        {Y_TICK_VALUES.map((v) => (
          <line
            key={v}
            x1={PLOT.left - 26} y1={sy(v)} x2={PLOT.left} y2={sy(v)}
            stroke={COLORS.cream} strokeWidth={5} strokeLinecap="round"
          />
        ))}
      </g>

      {/* X ticks + numbers */}
      <g opacity={tickFade}>
        {X_TICKS.map((v) => (
          <g key={v}>
            <line
              x1={sx(v)} y1={PLOT.bottom} x2={sx(v)} y2={PLOT.bottom + 24}
              stroke={COLORS.cream} strokeWidth={5} strokeLinecap="round"
            />
            <text
              x={sx(v)} y={PLOT.bottom + 76}
              fill={COLORS.cream} fontFamily={FONT.body} fontSize={38} fontWeight={700}
              textAnchor="middle" style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {v}
            </text>
          </g>
        ))}
      </g>

      {/* Axis titles */}
      <g opacity={labelFade}>
        <text
          x={PLOT.left - 62} y={(PLOT.top + PLOT.bottom) / 2}
          fill={COLORS.cream} fontFamily={FONT.display} fontSize={40} fontWeight={900}
          textAnchor="middle" letterSpacing={4}
          transform={`rotate(-90 ${PLOT.left - 62} ${(PLOT.top + PLOT.bottom) / 2})`}
        >
          AMOUNT
        </text>
        <text
          x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 140}
          fill={COLORS.cream} fontFamily={FONT.display} fontSize={40} fontWeight={900}
          textAnchor="middle" letterSpacing={4}
        >
          EFFECTIVE SETS / WEEK
        </text>
      </g>
    </g>
  );
};
