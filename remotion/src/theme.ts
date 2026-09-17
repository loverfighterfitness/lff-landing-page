/**
 * Lover Fighter Fitness — motion graphics tokens.
 *
 * Brand base is brown/cream. The two data colours deliberately depart from the
 * whiteboard original: Levi draws fatigue in black marker, which disappears
 * when the graphic is keyed over dark gym footage, so fatigue reads as ember
 * red here (it also carries the "this is the cost" meaning on its own).
 */
export const COLORS = {
  cream: "#EAE6D2",
  creamDim: "rgba(234, 230, 210, 0.55)",
  brown: "#54412F",

  /** Growth stimulus — matches the teal marker on the board. */
  growth: "#2EC4B6",
  growthGlow: "rgba(46, 196, 182, 0.45)",

  /** Fatigue — the cost line. */
  fatigue: "#FF4D3D",
  fatigueGlow: "rgba(255, 77, 61, 0.40)",

  /** Sweet spot band. */
  gold: "#F2B33D",
  goldSoft: "rgba(242, 179, 61, 0.18)",

  shadow: "rgba(0, 0, 0, 0.55)",
} as const;

export const FONT = {
  display: '"Montserrat", "Arial Black", Impact, sans-serif',
  body: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
} as const;

/** Drop shadow used on every badge and text run, so the overlay survives busy footage. */
export const TEXT_SHADOW = "0 6px 22px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.5)";
export const BOX_SHADOW = "0 18px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.35)";

/** Spring that overshoots then settles — the "slam" in the brief. */
export const SLAM = { damping: 12, stiffness: 200, mass: 0.85 } as const;
/** Gentler settle for things that shouldn't fight the slam elements. */
export const SETTLE = { damping: 18, stiffness: 140, mass: 0.9 } as const;
