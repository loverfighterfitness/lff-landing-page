import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT, SLAM, SETTLE } from "../theme";
import { ADVANCED_BAND, PLOT, SWEET_SPOT, sx } from "../curves";
import { BEATS } from "../timing";

/**
 * The gold band over the sweet spot. It slams in over 4-8 effective sets, then
 * on the payoff beat slides LEFT to an advanced lifter's range — the move is the
 * argument: more training age means less volume, not more.
 */
export const SweetSpotBand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = frame - BEATS.sweetSpot.in;
  if (t < 0) return null;

  const enter = spring({ frame: t, fps, config: SLAM });
  const shift = spring({ frame: frame - BEATS.payoff.in, fps, config: SETTLE });

  const lo = interpolate(shift, [0, 1], [SWEET_SPOT[0], ADVANCED_BAND[0]]);
  const hi = interpolate(shift, [0, 1], [SWEET_SPOT[1], ADVANCED_BAND[1]]);

  const x1 = sx(lo);
  const x2 = sx(hi);
  const w = x2 - x1;
  const top = PLOT.top - 10;
  const h = PLOT.bottom - top;

  // Band grows out of its own centre on entry.
  const cx = (x1 + x2) / 2;
  const scale = 0.4 + enter * 0.6;
  const label = shift > 0.5 ? "ADVANCED" : "SWEET SPOT";

  return (
    <g opacity={Math.min(1, enter * 1.8)} transform={`translate(${cx} 0) scale(${scale} 1) translate(${-cx} 0)`}>
      <rect
        x={x1} y={top} width={w} height={h} rx={28}
        fill={COLORS.goldSoft} stroke={COLORS.gold} strokeWidth={5}
      />
      {/* Badge sits just inside the band's top edge — above it would foul the legend pills. */}
      <g transform={`translate(${cx} ${top + 86})`}>
        <rect
          x={-170} y={-64} width={340} height={72} rx={36}
          fill={COLORS.gold}
          style={{ filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.5))" }}
        />
        <text
          x={0} y={-14}
          fill="#2A2018" fontFamily={FONT.display} fontSize={36} fontWeight={900}
          textAnchor="middle" letterSpacing={2}
        >
          {label}
        </text>
      </g>
      {/* Range readout at the foot of the band */}
      <text
        x={cx} y={PLOT.bottom - 26}
        fill={COLORS.gold} fontFamily={FONT.display} fontSize={46} fontWeight={900}
        textAnchor="middle" style={{ fontVariantNumeric: "tabular-nums", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }}
      >
        {shift > 0.5 ? "3–5" : "4–8"}
      </text>
    </g>
  );
};
