import { describe, expect, it } from "vitest";
import { SQUAT } from "./config";
import { LiftRunner, replayLift } from "./lift";
import { squat, type SquatState } from "./squat";
import { idle, tap } from "./testHelpers";

function tapEvery(r: LiftRunner<SquatState>, gap: number, until: (s: SquatState) => boolean, limit = 500) {
  for (let i = 0; i < limit && !r.done && !until(r.state); i++) {
    tap(r);
    idle(r, gap - 2);
  }
}

describe("squat", () => {
  it("ends at the time limit with no input", () => {
    const s = replayLift(squat, 1, []);
    expect(s.done).toBe(true);
    expect(s.tick).toBe(SQUAT.maxTicks);
    expect(s.score).toBe(0);
  });

  it("steady presses drive a clean, perfect rep", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, 12, (s) => s.reps === 1);
    expect(r.state.reps).toBe(1);
    expect(r.state.outcome).toBe("perfect");
    expect(r.state.score).toBe(SQUAT.startKg);
    expect(r.state.kg).toBe(SQUAT.startKg + SQUAT.perfectJump);
    expect(r.state.combo).toBe(1);
  });

  it("mashing as fast as possible breaks form and loses the rep", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, 5, (s) => s.formBreaks > 0);
    expect(r.state.formBreaks).toBe(1);
    expect(r.state.reps).toBe(0);
    expect(r.state.outcome).toBe("formbreak");
    expect(r.state.progress).toBe(0);
  });

  it("grinding a rep slowly triggers the TUT trap", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, 12, (s) => s.progress > 0.5);
    idle(r, SQUAT.tutIdleTicks);
    expect(r.state.tutTriggers).toBe(1);
    expect(r.state.outcome).toBe("tut");
    expect(r.state.progress).toBe(0);
    expect(r.state.score).toBe(0);
  });

  it("the TUT penalty comes off your best squat", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, 12, (s) => s.reps === 1);
    idle(r, SQUAT.cooldownTicks);
    tapEvery(r, 12, (s) => s.progress > 0.5);
    idle(r, SQUAT.tutIdleTicks);
    expect(r.state.score).toBe(SQUAT.startKg - SQUAT.tutPenaltyKg);
    expect(r.state.combo).toBe(0);
  });
});
