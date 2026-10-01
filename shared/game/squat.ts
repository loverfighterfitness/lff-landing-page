import { SQUAT } from "./config";
import type { LiftSim, LiftStateBase } from "./lift";

export interface SquatState extends LiftStateBase {
  /** 0 = bottom of the squat, 1 = locked out. */
  progress: number;
  /** Form strain; at 1 the rep is lost. */
  strain: number;
  lastPressTick: number;
  idleTicks: number;
  reps: number;
  cooldown: number;
  tutTriggers: number;
  formBreaks: number;
  /** Weight on the bar for the next rep. */
  kg: number;
  /** Heaviest rep completed. Score = bestKg minus any TUT penalties. */
  bestKg: number;
}

/** Mash to drive out of the hole — but mash too fast and your form breaks. Grind too slow and Levi calls out your TUT. */
export const squat: LiftSim<SquatState> = {
  id: "squat",
  maxTicks: SQUAT.maxTicks,

  init() {
    return {
      tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0,
      progress: 0, strain: 0, lastPressTick: -1000, idleTicks: 0, reps: 0, cooldown: 0, tutTriggers: 0, formBreaks: 0,
      kg: SQUAT.startKg, bestKg: 0,
    };
  },

  step(s, input) {
    s.strain = Math.max(0, s.strain - SQUAT.strainDecayPerTick);
    if (s.cooldown > 0) {
      s.cooldown--;
      return;
    }
    if (input.pressed) {
      if (s.tick - s.lastPressTick < SQUAT.fastPressTicks) s.strain += SQUAT.strainPerFastPress;
      s.lastPressTick = s.tick;
      s.idleTicks = 0;
      if (s.strain >= 1) {
        s.outcome = "formbreak";
        s.outcomeTick = s.tick;
        s.formBreaks++;
        s.combo = 0;
        s.progress = 0;
        s.strain = 0;
        s.cooldown = SQUAT.formBreakCooldownTicks;
        return;
      }
      s.progress += SQUAT.drivePerPress;
      if (s.progress >= 1) {
        const perfect = s.strain <= SQUAT.perfectStrainMax;
        s.outcome = perfect ? "perfect" : "good";
        s.outcomeTick = s.tick;
        if (perfect) {
          s.combo++;
          s.perfects++;
        }
        s.bestKg = s.kg;
        s.kg += perfect ? SQUAT.perfectJump : SQUAT.goodJump;
        s.score = Math.max(0, s.bestKg - s.tutTriggers * SQUAT.tutPenaltyKg);
        s.reps++;
        s.progress = 0;
        s.cooldown = SQUAT.cooldownTicks;
      }
      return;
    }
    if (s.progress > 0) {
      s.progress = Math.max(0, s.progress - SQUAT.gravityPerTick);
      s.idleTicks++;
      if (s.idleTicks >= SQUAT.tutIdleTicks) {
        s.outcome = "tut";
        s.outcomeTick = s.tick;
        s.tutTriggers++;
        s.combo = 0;
        s.score = Math.max(0, s.bestKg - s.tutTriggers * SQUAT.tutPenaltyKg);
        s.progress = 0;
        s.idleTicks = 0;
      }
    }
  },
};
