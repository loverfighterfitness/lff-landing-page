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

  it("on-beat taps drive harder than off-beat taps", () => {
    const drive = (gap: number) => {
      const events = [];
      for (let i = 0, t = 0; i < 4; i++, t += gap) events.push({ tick: t, down: true }, { tick: t + 3, down: false });
      return replayLift({ ...squat, maxTicks: 3 * gap + 1 }, 1, events).progress;
    };
    expect(drive(SQUAT.tempoTicks)).toBeGreaterThan(drive(SQUAT.tempoTicks + 4));
  });

  it("steady presses drive a clean, perfect rep", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, SQUAT.tempoTicks, (s) => s.reps === 1);
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
    tapEvery(r, SQUAT.tempoTicks, (s) => s.progress > 0.5);
    idle(r, SQUAT.tutIdleTicks);
    expect(r.state.tutTriggers).toBe(1);
    expect(r.state.outcome).toBe("tut");
    expect(r.state.progress).toBe(0);
    expect(r.state.score).toBe(0);
  });

  it("the TUT penalty comes off your best squat", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, SQUAT.tempoTicks, (s) => s.reps === 1);
    idle(r, SQUAT.cooldownTicks);
    tapEvery(r, SQUAT.tempoTicks, (s) => s.progress > 0.5);
    idle(r, SQUAT.tutIdleTicks);
    expect(r.state.score).toBe(SQUAT.startKg - SQUAT.tutPenaltyKg);
    expect(r.state.combo).toBe(0);
  });
});
