/** Every gameplay tuning number lives here. Change these while playtesting, not the lift code. */

export const TICK_MS = 10;
/** Fastest a human can re-press (50 ms ≈ 20 taps/s). Faster presses are ignored client-side and rejected server-side. */
export const MIN_PRESS_GAP_TICKS = 5;
export const MAX_EVENTS_PER_LIFT = 1500;
export const RUN_TOKEN_TTL_MS = 10 * 60_000;
/** Share of the replayed play time a run must have really taken. */
export const MIN_PLAYTIME_FRACTION = 0.8;

export const COMBO_STEP = 0.1;
export const COMBO_MAX_MULT = 2;

export const BENCH = {
  maxTicks: 2500,
  maxMisses: 3,
  zoneStart: 0.24,
  zoneMin: 0.08,
  zoneShrink: 0.015,
  /** Perfect band as a fraction of the green zone's width. */
  perfectFraction: 0.3,
  speedStart: 0.006,
  speedStep: 0.0006,
  speedMax: 0.02,
  goodPoints: 100,
  perfectPoints: 200,
  cooldownTicks: 30,
  startKg: 60,
  kgPerRep: 10,
} as const;

export const SQUAT = {
  maxTicks: 2000,
  drivePerPress: 0.12,
  gravityPerTick: 0.002,
  /** Presses closer together than this strain your form. */
  fastPressTicks: 9,
  strainPerFastPress: 0.25,
  strainDecayPerTick: 0.004,
  perfectStrainMax: 0.3,
  repPoints: 150,
  cooldownTicks: 40,
  formBreakCooldownTicks: 60,
  /** Sitting in a rep this long without pressing = chasing "time under tension". */
  tutIdleTicks: 150,
  tutPenalty: 50,
} as const;

export const DEADLIFT = {
  maxTicks: 2000,
  startKg: 100,
  kgStep: 20,
  gaugeRateStart: 0.008,
  gaugeRateStep: 0.001,
  sweetMin: 0.72,
  sweetMax: 0.9,
  perfectHalfWidth: 0.025,
  /** Releases below this are treated as an accidental tap, not a failed pull. */
  ignoreBelow: 0.05,
  cooldownTicks: 60,
} as const;
