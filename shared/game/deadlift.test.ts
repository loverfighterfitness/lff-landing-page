import { describe, expect, it } from "vitest";
import { DEADLIFT, IDLE_LIMIT_TICKS } from "./config";
import { deadlift, DEADLIFT_CENTRE, type DeadliftState } from "./deadlift";
import { LiftRunner, replayLift } from "./lift";
import { idle, stepUntil, tap } from "./testHelpers";

function pullTo(r: LiftRunner<DeadliftState>, pred: (s: DeadliftState) => boolean) {
  r.setDown(true);
  r.advance();
  expect(stepUntil(r, (s) => s.pulling && pred(s))).toBe(true);
  r.setDown(false);
  r.advance();
}

describe("deadlift", () => {
  it("ends after standing idle with no input", () => {
    const s = replayLift(deadlift, 1, []);
    expect(s.done).toBe(true);
    expect(s.tick).toBe(IDLE_LIMIT_TICKS);
  });

  it("releasing dead-centre is a perfect lockout with the biggest jump", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => Math.abs(s.gauge - DEADLIFT_CENTRE) < 0.005);
    expect(r.state.outcome).toBe("perfect");
    expect(r.state.score).toBe(DEADLIFT.startKg);
    expect(r.state.bestKg).toBe(DEADLIFT.startKg);
    expect(r.state.kg).toBe(DEADLIFT.startKg + DEADLIFT.perfectJump);
    expect(r.state.done).toBe(false);
  });

  it("releasing inside the sweet spot but off-centre is a good lockout with a smaller jump", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => s.gauge > DEADLIFT.sweetMin + 0.01 && s.gauge < DEADLIFT_CENTRE - 0.04);
    expect(r.state.outcome).toBe("good");
    expect(r.state.score).toBe(DEADLIFT.startKg);
    expect(r.state.kg).toBe(DEADLIFT.startKg + DEADLIFT.goodJump);
    expect(r.state.combo).toBe(0);
  });

  it("releasing early fails the lift and ends it", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => s.gauge > 0.4 && s.gauge < 0.6);
    expect(r.state.outcome).toBe("miss");
    expect(r.state.done).toBe(true);
  });

  it("holding too long fails the lift", () => {
    const r = new LiftRunner(deadlift, 1);
    r.setDown(true);
    idle(r, 300);
    expect(r.state.outcome).toBe("miss");
    expect(r.state.done).toBe(true);
  });

  it("an accidental quick tap is ignored", () => {
    const r = new LiftRunner(deadlift, 1);
    tap(r);
    expect(r.state.done).toBe(false);
    expect(r.state.outcome).toBe(null);
    expect(r.state.pulling).toBe(false);
  });

  it("each lockout loads more weight and the heaviest is the score", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => Math.abs(s.gauge - DEADLIFT_CENTRE) < 0.005);
    idle(r, DEADLIFT.cooldownTicks);
    pullTo(r, (s) => Math.abs(s.gauge - DEADLIFT_CENTRE) < 0.005);
    const second = DEADLIFT.startKg + DEADLIFT.perfectJump;
    expect(r.state.score).toBe(second);
    expect(r.state.bestKg).toBe(second);
  });

  it("holding through the plate change requires a fresh press", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => Math.abs(s.gauge - DEADLIFT_CENTRE) < 0.005);
    r.setDown(true);
    idle(r, DEADLIFT.cooldownTicks + 10);
    expect(r.state.pulling).toBe(false);
    expect(r.state.gauge).toBe(0);
    r.setDown(false);
    r.advance();
    r.setDown(true);
    r.advance();
    expect(r.state.pulling).toBe(true);
  });
});
