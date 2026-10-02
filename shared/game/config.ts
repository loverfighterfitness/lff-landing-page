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

/**
 * Scoring is a powerlifting total: best bench + best squat + best deadlift, in kg.
 * Each lift is a max-out, not a timed set: it runs until you fail, and every rep is harder than the
 * last, so how heavy you get is decided by skill. The tick limits are only a safety backstop.
 * Every successful rep locks in the weight on the bar; a PERFECT rep earns a bigger jump for the
 * next one than a GOOD rep, so timing decides how heavy you get. All jumps are multiples of 5 kg.
 */

/** Waiting this long without starting a rep ends the lift (or costs a bench miss): no AFK runs. */
export const IDLE_LIMIT_TICKS = 600;

export const BENCH = {
  /** Safety backstop only; skill ends the set first. */
  maxTicks: 9000,
  maxMisses: 3,
  zoneStart: 0.24,
  zoneMin: 0.03,
  zoneShrink: 0.01,
  /** Perfect band as a fraction of the green zone's width. */
  perfectFraction: 0.3,
  speedStart: 0.006,
  speedStep: 0.0007,
  speedMax: 0.04,
  /** Each rep takes ~0.8 s to press and re-rack, which keeps a set to ~10-14 reps. */
  cooldownTicks: 80,
  startKg: 30,
  perfectJump: 10,
  goodJump: 5,
} as const;

export const SQUAT = {
  maxTicks: 9000,
  drivePerPress: 0.16,
  gravityPerTick: 0.0015,
  /**
   * Rhythm: a tap drives fully when it lands this many ticks after the last one (250 ms, 4 taps/s —
   * slow enough to follow the on-screen beat meter), and loses drive the further off the beat it is,
   * down to nothing at `tempoTolTicks` off.
   */
  tempoTicks: 25,
  tempoTolTicks: 12,
  /** Even a sloppy tap gives this much drive, so light reps can be ground out; the beat decides the heavy ones. */
  minBeat: 0.3,
  /** Average beat quality a rep needs to count as PERFECT. */
  perfectTempo: 0.8,
  /** Heavier reps: each one gets less drive per tap and more pull back down. */
  driveDecayPerRep: 0.975,
  gravityGrowthPerRep: 1.02,
  /** A rep not locked out this long after its first tap is a failed rep, and the set ends. */
  repTimeLimitTicks: 600,
  /** Presses closer together than this strain your form. */
  fastPressTicks: 14,
  strainPerFastPress: 0.2,
  strainDecayPerTick: 0.004,
  perfectStrainMax: 0.3,
  startKg: 50,
  perfectJump: 10,
  goodJump: 5,
  cooldownTicks: 40,
  formBreakCooldownTicks: 60,
  /** Sitting in a rep this long without pressing = chasing "time under tension". */
  tutIdleTicks: 150,
  /** Chasing TUT costs kg off your best squat. */
  tutPenaltyKg: 10,
} as const;

export const DEADLIFT = {
  maxTicks: 9000,
  startKg: 100,
  perfectJump: 10,
  goodJump: 5,
  gaugeRateStart: 0.008,
  gaugeRateStep: 0.0012,
  sweetMin: 0.72,
  sweetMax: 0.9,
  perfectHalfWidth: 0.025,
  /** Releases below this are treated as an accidental tap, not a failed pull. */
  ignoreBelow: 0.05,
  cooldownTicks: 60,
} as const;
