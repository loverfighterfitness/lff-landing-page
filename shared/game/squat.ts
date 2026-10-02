import { IDLE_LIMIT_TICKS, SQUAT } from "./config";
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
  /** Tick of this rep's first tap (-1 = not started). */
  repStart: number;
  /** Ticks waiting at the start of a rep without tapping. */
  waitTicks: number;
  /** On-beat quality of the last tap (0..1) and the running sum/count for this rep. */
  beat: number;
  beatSum: number;
  beatTaps: number;
}

/**
 * Mash to drive out of the hole — but mash too fast and your form breaks. Grind too slow and Levi calls out your TUT.
 * Max-out: every rep needs more taps against more pull-down, and a rep not locked out in time ends the set.
 */
export const squat: LiftSim<SquatState> = {
  id: "squat",
  maxTicks: SQUAT.maxTicks,

  init() {
    return {
      tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0,
      progress: 0, strain: 0, lastPressTick: -1000, idleTicks: 0, reps: 0, cooldown: 0, tutTriggers: 0, formBreaks: 0,
      kg: SQUAT.startKg, bestKg: 0, repStart: -1, waitTicks: 0, beat: 0, beatSum: 0, beatTaps: 0,
    };
  },

  step(s, input) {
    s.strain = Math.max(0, s.strain - SQUAT.strainDecayPerTick);
    if (s.cooldown > 0) {
      s.cooldown--;
      return;
    }
    // Failed rep: couldn't lock it out in time. The set is over.
    if (s.repStart >= 0 && s.tick - s.repStart >= SQUAT.repTimeLimitTicks) {
      fail(s);
      return;
    }
    if (s.repStart < 0 && !input.pressed && ++s.waitTicks >= IDLE_LIMIT_TICKS) {
      fail(s);
      return;
    }
    if (input.pressed) {
      const gap = s.tick - s.lastPressTick;
      // The first tap of a rep sets the beat; after that, drive depends on staying on it.
      s.beat = s.repStart < 0 ? 0.6 : Math.max(0, 1 - Math.abs(gap - SQUAT.tempoTicks) / SQUAT.tempoTolTicks);
      if (s.repStart >= 0) {
        s.beatSum += s.beat;
        s.beatTaps++;
      }
      if (s.repStart < 0) s.repStart = s.tick;
      s.waitTicks = 0;
      if (gap < SQUAT.fastPressTicks) s.strain += SQUAT.strainPerFastPress;
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
      s.progress += SQUAT.drivePerPress * SQUAT.driveDecayPerRep ** s.reps * s.beat;
      if (s.progress >= 1) {
        const tempo = s.beatTaps ? s.beatSum / s.beatTaps : 0;
        const perfect = s.strain <= SQUAT.perfectStrainMax && tempo >= SQUAT.perfectTempo;
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
        s.repStart = -1;
        s.beatSum = 0;
        s.beatTaps = 0;
        s.cooldown = SQUAT.cooldownTicks;
      }
      return;
    }
    if (s.progress > 0) {
      s.progress = Math.max(0, s.progress - SQUAT.gravityPerTick * SQUAT.gravityGrowthPerRep ** s.reps);
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

function fail(s: SquatState) {
  s.outcome = "miss";
  s.outcomeTick = s.tick;
  s.combo = 0;
  s.progress = 0;
  s.done = true;
}
