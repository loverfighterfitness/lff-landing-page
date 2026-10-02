import { describe, expect, it } from "vitest";
import { IDLE_LIMIT_TICKS, SQUAT } from "./config";
import { LiftRunner, replayLift } from "./lift";
import { squat, type SquatState } from "./squat";
import { idle, tap } from "./testHelpers";

function tapEvery(r: LiftRunner<SquatState>, gap: number, until: (s: SquatState) => boolean, limit = 500) {
  for (let i = 0; i < limit && !r.done && !until(r.state); i++) {
    tap(r);
    idle(r, gap - 2);
  }
}

/** A steady mashing pace (90 ms between taps). */
const STEADY = 9;

describe("squat", () => {
  it("ends after standing idle with no input", () => {
    const s = replayLift(squat, 1, []);
    expect(s.done).toBe(true);
    expect(s.tick).toBe(IDLE_LIMIT_TICKS);
    expect(s.score).toBe(0);
  });

  it("a rep not locked out in time is a failed rep and ends the set", () => {
    // Taps far too slow to drive the bar up: the rep clock runs out.
    const events = [];
    for (let t = 0; t < SQUAT.repTimeLimitTicks + 100; t += 40) events.push({ tick: t, down: true }, { tick: t + 3, down: false });
    const s = replayLift(squat, 1, events);
    expect(s.done).toBe(true);
    expect(s.outcome).toBe("miss");
    expect(s.reps).toBe(0);
  });

  it("steady taps drive harder than erratic ones", () => {
    const run = (gaps: number[]) => {
      const events = [];
      let t = 0;
      for (const g of gaps) {
        events.push({ tick: t, down: true }, { tick: t + 2, down: false });
        t += g;
      }
      return replayLift({ ...squat, maxTicks: t - gaps[gaps.length - 1] + 1 }, 1, events).progress;
    };
    // Same number of taps in about the same time; one steady, one all over the place.
    expect(run([9, 9, 9, 9, 9, 9])).toBeGreaterThan(run([5, 14, 6, 13, 5, 11]));
  });

  it("steady mashing drives a clean, perfect rep", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, STEADY, (s) => s.reps === 1);
    expect(r.state.reps).toBe(1);
    expect(r.state.outcome).toBe("perfect");
    expect(r.state.score).toBe(SQUAT.startKg);
    expect(r.state.kg).toBe(SQUAT.startKg + SQUAT.perfectJump);
    expect(r.state.combo).toBe(1);
  });

  it("there's no speed cap: steady mashing at the fastest allowed rate still lifts", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, 6, (s) => s.reps === 1);
    expect(r.state.reps).toBe(1);
  });

  it("grinding a rep slowly triggers the TUT trap", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, STEADY, (s) => s.progress > 0.5);
    idle(r, SQUAT.tutIdleTicks);
    expect(r.state.tutTriggers).toBe(1);
    expect(r.state.outcome).toBe("tut");
    expect(r.state.progress).toBe(0);
    expect(r.state.score).toBe(0);
  });

  it("the TUT penalty comes off your best squat", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, STEADY, (s) => s.reps === 1);
    idle(r, SQUAT.cooldownTicks);
    tapEvery(r, STEADY, (s) => s.progress > 0.5);
    idle(r, SQUAT.tutIdleTicks);
    expect(r.state.score).toBe(SQUAT.startKg - SQUAT.tutPenaltyKg);
    expect(r.state.combo).toBe(0);
  });
});
