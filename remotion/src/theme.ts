/**
 * Non-colour design tokens. Colour lives in palettes.ts, because the same
 * component tree renders four different looks.
 */
export const FONT = {
  display: '"Montserrat", "Arial Black", Impact, sans-serif',
  body: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
} as const;

/** Drop shadows, so the overlay survives busy footage whatever the palette. */
export const TEXT_SHADOW =
  "0 6px 22px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.5)";
export const BOX_SHADOW =
  "0 18px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.35)";

/** Spring that overshoots then settles — the "slam". */
export const SLAM = { damping: 12, stiffness: 200, mass: 0.85 } as const;
/** Gentler settle for things that shouldn't fight the slam elements. */
export const SETTLE = { damping: 18, stiffness: 140, mass: 0.9 } as const;
