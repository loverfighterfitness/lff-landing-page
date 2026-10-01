import { award } from "./combo";
import { DEADLIFT } from "./config";
import type { LiftSim, LiftStateBase } from "./lift";

export const DEADLIFT_CENTRE = (DEADLIFT.sweetMin + DEADLIFT.sweetMax) / 2;

export interface DeadliftState extends LiftStateBase {
  /** Power gauge 0..1 while pulling. */
  gauge: number;
  pulling: boolean;
  attempt: number;
  /** Weight on the bar for the current attempt. */
  kg: number;
  bestKg: number;
  cooldown: number;
  /** Player was still holding when the plates finished loading — must let go first. */
  needRelease: boolean;
}

function fail(s: DeadliftState) {
  s.outcome = "miss";
  s.outcomeTick = s.tick;
  s.combo = 0;
  s.pulling = false;
  s.done = true;
}

/** Hold to pull, release in the sweet spot to lock out. Plates get heavier every lockout; one miss ends it. */
export const deadlift: LiftSim<DeadliftState> = {
  id: "deadlift",
  maxTicks: DEADLIFT.maxTicks,

  init() {
    return {
      tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0,
      gauge: 0, pulling: false, attempt: 0, kg: DEADLIFT.startKg, bestKg: 0, cooldown: 0, needRelease: false,
    };
  },

  step(s, input) {
    if (s.cooldown > 0) {
      s.cooldown--;
      if (s.cooldown === 0) s.needRelease = input.down;
      return;
    }
    if (s.needRelease) {
      if (!input.down) s.needRelease = false;
      return;
    }
    if (!s.pulling) {
      if (input.pressed) {
        s.pulling = true;
        s.gauge = 0;
      }
      return;
    }
    if (input.down) {
      s.gauge += DEADLIFT.gaugeRateStart + DEADLIFT.gaugeRateStep * s.attempt;
      if (s.gauge >= 1) fail(s);
      return;
    }
    // Released.
    s.pulling = false;
    if (s.gauge < DEADLIFT.ignoreBelow) {
      s.gauge = 0;
      return;
    }
    if (s.gauge < DEADLIFT.sweetMin || s.gauge > DEADLIFT.sweetMax) {
      fail(s);
      return;
    }
    const perfect = Math.abs(s.gauge - DEADLIFT_CENTRE) <= DEADLIFT.perfectHalfWidth;
    s.outcome = perfect ? "perfect" : "good";
    s.outcomeTick = s.tick;
    s.score += award(s.kg * (perfect ? DEADLIFT.perfectPointsPerKg : DEADLIFT.goodPointsPerKg), s.combo);
    if (perfect) {
      s.combo++;
      s.perfects++;
    }
    s.bestKg = s.kg;
    s.attempt++;
    s.kg += DEADLIFT.kgStep;
    s.gauge = 0;
    s.cooldown = DEADLIFT.cooldownTicks;
  },
};
