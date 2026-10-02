import { IDLE_LIMIT_TICKS, SQUAT } from "./config";
import type { LiftSim, LiftStateBase } from "./lift";

export interface SquatState extends LiftStateBase {
  /** 0 = bottom of the squat, 1 = locked out. */
  progress: number;
  lastPressTick: number;
  idleTicks: number;
  reps: number;
  cooldown: number;
  tutTriggers: number;
  /** Weight on the bar for the next rep. */
  kg: number;
  /** Heaviest rep completed. Score = bestKg minus any TUT penalties. */
  bestKg: number;
  /** Tick of this rep's first tap (-1 = not started). */
  repStart: number;
  /** Ticks waiting at the start of a rep without tapping. */
  waitTicks: number;
  /** Your running tap gap (ticks): the rhythm each tap is judged against. */
  avgGap: number;
  /** Rhythm of the last tap (0..1) and a smoothed rhythm for the meter. */
  beat: number;
  flow: number;
  beatSum: number;
  beatTaps: number;
}

/**
 * Mash to drive out of the hole, as fast as you like — but only steady taps drive hard; erratic ones barely
 * move the bar. Grind too slow and Levi calls out your TUT. Max-out: every rep needs more against more
 * pull-down, and a rep not locked out in time ends the set.
 */
export const squat: LiftSim<SquatState> = {
  id: "squat",
  maxTicks: SQUAT.maxTicks,

  init() {
    return {
      tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0,
      progress: 0, lastPressTick: -1000, idleTicks: 0, reps: 0, cooldown: 0, tutTriggers: 0,
      kg: SQUAT.startKg, bestKg: 0, repStart: -1, waitTicks: 0, avgGap: 10, beat: 0, flow: 0, beatSum: 0, beatTaps: 0,
    };
  },

  step(s, input) {
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
      if (s.repStart < 0) {
        // The first tap of a rep just gets it moving.
        s.repStart = s.tick;
        s.beat = 0.6;
      } else {
        s.beat = Math.min(1, Math.max(SQUAT.minBeat, 1 - Math.abs(gap - s.avgGap) / s.avgGap / SQUAT.rhythmTol));
        s.beatSum += s.beat;
        s.beatTaps++;
        s.avgGap += SQUAT.rhythmFollow * (Math.min(gap, 60) - s.avgGap);
      }
      s.flow += 0.3 * (s.beat - s.flow);
      s.waitTicks = 0;
      s.lastPressTick = s.tick;
      s.idleTicks = 0;
      s.progress += SQUAT.drivePerPress * SQUAT.driveDecayPerRep ** s.reps * s.beat;
      if (s.progress >= 1) {
        const tempo = s.beatTaps ? s.beatSum / s.beatTaps : 0;
        const perfect = tempo >= SQUAT.perfectTempo;
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
