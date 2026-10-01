import { award } from "./combo";
import { BENCH } from "./config";
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
  /** Bar weight shown on screen (cosmetic). */
  kg: number;
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
      speed: BENCH.speedStart, cooldown: 0, kg: BENCH.startKg,
    };
  },

  step(s, input) {
    if (s.cooldown > 0) {
      s.cooldown--;
      return;
    }
    if (input.pressed) {
      const off = Math.abs(s.pos - s.zoneCenter);
      s.outcomeTick = s.tick;
      s.cooldown = BENCH.cooldownTicks;
      if (off <= (s.zoneWidth * BENCH.perfectFraction) / 2) {
        s.outcome = "perfect";
        s.score += award(BENCH.perfectPoints, s.combo);
        s.combo++;
        s.perfects++;
      } else if (off <= s.zoneWidth / 2) {
        s.outcome = "good";
        s.score += award(BENCH.goodPoints, s.combo);
      } else {
        s.outcome = "miss";
        s.combo = 0;
        s.misses++;
        if (s.misses >= BENCH.maxMisses) s.done = true;
        return;
      }
      s.reps++;
      s.kg = BENCH.startKg + BENCH.kgPerRep * s.reps;
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
