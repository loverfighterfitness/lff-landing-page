import { BENCH, IDLE_LIMIT_TICKS } from "./config";
import type { LiftSim, LiftStateBase } from "./lift";
import { randAt } from "./rng";

export interface BenchState extends LiftStateBase {
  seed: number;
  /** Marker position across the meter, 0..1. */
  pos: number;
  dir: 1 | -1;
  reps: number;
  misses: number;
  zoneCenter: number;
  zoneWidth: number;
  speed: number;
  cooldown: number;
  /** Weight on the bar for the next rep. */
  kg: number;
  /** Heaviest rep completed — this lift's score. */
  bestKg: number;
  /** Ticks since the bar was ready without a tap. */
  idleTicks: number;
}

function zoneFor(seed: number, reps: number) {
  return {
    center: 0.2 + 0.6 * randAt(seed, reps),
    width: Math.max(BENCH.zoneMin, BENCH.zoneStart - BENCH.zoneShrink * reps),
  };
}

/** Timing meter: tap while the sweeping marker is in the green zone. */
export const bench: LiftSim<BenchState> = {
  id: "bench",
  maxTicks: BENCH.maxTicks,

  init(seed) {
    const z = zoneFor(seed, 0);
    return {
      tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0,
      seed, pos: 0, dir: 1, reps: 0, misses: 0,
      zoneCenter: z.center, zoneWidth: z.width,
      speed: BENCH.speedStart, cooldown: 0, kg: BENCH.startKg, bestKg: 0, idleTicks: 0,
    };
  },

  step(s, input) {
    if (s.cooldown > 0) {
      s.cooldown--;
      return;
    }
    if (!input.pressed && ++s.idleTicks >= IDLE_LIMIT_TICKS) {
      // Sat there with the bar unracked: that's a missed rep.
      s.idleTicks = 0;
      s.outcome = "miss";
      s.outcomeTick = s.tick;
      s.combo = 0;
      s.misses++;
      s.cooldown = BENCH.cooldownTicks;
      if (s.misses >= BENCH.maxMisses) s.done = true;
      return;
    }
    if (input.pressed) {
      s.idleTicks = 0;
      const off = Math.abs(s.pos - s.zoneCenter);
      s.outcomeTick = s.tick;
      s.cooldown = BENCH.cooldownTicks;
      let jump: number;
      if (off <= (s.zoneWidth * BENCH.perfectFraction) / 2) {
        s.outcome = "perfect";
        s.combo++;
        s.perfects++;
        jump = BENCH.perfectJump;
      } else if (off <= s.zoneWidth / 2) {
        s.outcome = "good";
        jump = BENCH.goodJump;
      } else {
        s.outcome = "miss";
        s.combo = 0;
        s.misses++;
        if (s.misses >= BENCH.maxMisses) s.done = true;
        return;
      }
      s.reps++;
      s.bestKg = s.kg;
      s.score = s.bestKg;
      s.kg += jump;
      const z = zoneFor(s.seed, s.reps);
      s.zoneCenter = z.center;
      s.zoneWidth = z.width;
      s.speed = Math.min(BENCH.speedMax, BENCH.speedStart + BENCH.speedStep * s.reps);
      return;
    }
    s.pos += s.speed * s.dir;
    if (s.pos >= 1) {
      s.pos = 2 - s.pos;
      s.dir = -1;
    } else if (s.pos <= 0) {
      s.pos = -s.pos;
      s.dir = 1;
    }
  },
};
