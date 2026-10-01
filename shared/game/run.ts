import { bench } from "./bench";
import { deadlift } from "./deadlift";
import { replayLift, type LiftSim, type LiftStateBase } from "./lift";
import { squat } from "./squat";
import { LIFTS, type LiftId, type LiftScores, type RunLogs } from "./types";

export const LIFT_SIMS = { bench, squat, deadlift } as const;

/** Each lift gets its own seed derived from the run's seed. */
export function liftSeed(seed: number, lift: LiftId): number {
  return (seed ^ Math.imul(LIFTS.indexOf(lift) + 1, 0x85ebca6b)) >>> 0;
}

export function replayRun(seed: number, logs: RunLogs): { scores: LiftScores; total: number; ticks: number } {
  const scores = { bench: 0, squat: 0, deadlift: 0 } as LiftScores;
  let ticks = 0;
  for (const lift of LIFTS) {
    // Each sim has its own state type; the shared base is all we read here.
    const sim: LiftSim<LiftStateBase> = LIFT_SIMS[lift];
    const state = replayLift(sim, liftSeed(seed, lift), logs[lift]);
    scores[lift] = state.score;
    ticks += state.tick;
  }
  return { scores, total: scores.bench + scores.squat + scores.deadlift, ticks };
}
