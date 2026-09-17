/**
 * The chart's geometry and the two dose-response curves behind the graphic.
 *
 * X is EFFECTIVE sets per week — hard sets taken close enough to failure to
 * count as a stimulus, not total sets logged. That is why the sweet spot sits
 * at 4-8 rather than the 10-20 you see quoted for total weekly volume.
 */

export const CANVAS = { width: 1080, height: 1920 } as const;

/** Plot rectangle in canvas pixels. */
export const PLOT = { left: 150, right: 1010, top: 470, bottom: 1170 } as const;

export const X_DOMAIN: readonly [number, number] = [0, 14];
export const Y_DOMAIN: readonly [number, number] = [0, 1.3];

export const X_TICKS = [2, 4, 6, 8, 10, 12, 14];

/** The sweet spot, in effective sets per week. */
export const SWEET_SPOT: readonly [number, number] = [4, 8];
/** Where an advanced lifter's band sits once it slides left. */
export const ADVANCED_BAND: readonly [number, number] = [2.5, 5.5];

/** Domain value -> canvas x. */
export const sx = (x: number): number =>
  PLOT.left +
  ((x - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * (PLOT.right - PLOT.left);

/** Domain value -> canvas y (inverted: bigger value sits higher). */
export const sy = (y: number): number =>
  PLOT.bottom -
  ((y - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) * (PLOT.bottom - PLOT.top);

/**
 * Growth stimulus: saturating exponential. Steep early, then a hard plateau —
 * 81% of the available stimulus is bought by set 4, 96% by set 8.
 */
export const growth = (x: number): number => 1 - Math.exp(-0.4 * x);

/** Fatigue: linear. It never plateaus; that is the whole point of the graphic. */
export const fatigue = (x: number): number => x / 11;

/** Where fatigue overtakes growth stimulus — solved by bisection, not hardcoded. */
export const crossoverX = ((): number => {
  let lo = 1;
  let hi = X_DOMAIN[1];
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (fatigue(mid) < growth(mid)) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();

export type Path = { d: string; length: number };

/** Sample a function into an SVG path, carrying its own arc length for dash animation. */
export const buildPath = (
  fn: (x: number) => number,
  from = X_DOMAIN[0],
  to = X_DOMAIN[1],
  steps = 260
): Path => {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const x = from + (to - from) * (i / steps);
    pts.push([sx(x), sy(fn(x))]);
  }
  let length = 0;
  for (let i = 1; i < pts.length; i++) {
    length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  const d = pts
    .map(
      ([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(2)} ${py.toFixed(2)}`
    )
    .join(" ");
  return { d, length };
};

export const GROWTH_PATH = buildPath(growth);
export const FATIGUE_PATH = buildPath(fatigue);
