import { MAX_EVENTS_PER_LIFT, MIN_PLAYTIME_FRACTION, MIN_PRESS_GAP_TICKS, RUN_TOKEN_TTL_MS, TICK_MS } from "./config";
import { LIFT_SIMS, replayRun } from "./run";
import { LIFTS, type InputEvent, type LiftId, type LiftScores, type RunLogs } from "./types";

export type RunCheck =
  | { ok: true; scores: LiftScores; total: number; ticks: number }
  | { ok: false; reason: string };

/** Is this an input log a human on a real device could have produced? Returns a reason if not. */
export function checkLog(lift: LiftId, events: InputEvent[]): string | null {
  if (events.length > MAX_EVENTS_PER_LIFT) return "too many events";
  const maxTicks = LIFT_SIMS[lift].maxTicks;
  let lastTick = -1;
  let expectDown = true;
  let lastDownTick = -Infinity;
  for (const e of events) {
    if (!Number.isInteger(e.tick) || e.tick < 0 || e.tick >= maxTicks) return "tick out of range";
    if (e.tick < lastTick) return "ticks out of order";
    if (e.down !== expectDown) return "events not alternating";
    if (e.down) {
      if (e.tick - lastDownTick < MIN_PRESS_GAP_TICKS) return "presses too fast";
      lastDownTick = e.tick;
    }
    lastTick = e.tick;
    expectDown = !expectDown;
  }
  return null;
}

/**
 * Re-score a submitted run from its input logs and check it was played in real time.
 * `elapsedMs` = server time between issuing the run token and receiving the submission.
 */
export function checkRun(seed: number, logs: RunLogs, elapsedMs: number): RunCheck {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return { ok: false, reason: "bad timing" };
  for (const lift of LIFTS) {
    const reason = checkLog(lift, logs[lift]);
    if (reason) return { ok: false, reason: `${lift}: ${reason}` };
  }
  if (elapsedMs > RUN_TOKEN_TTL_MS) return { ok: false, reason: "run expired" };
  const result = replayRun(seed, logs);
  if (elapsedMs < result.ticks * TICK_MS * MIN_PLAYTIME_FRACTION) return { ok: false, reason: "finished too fast" };
  return { ok: true, ...result };
}
