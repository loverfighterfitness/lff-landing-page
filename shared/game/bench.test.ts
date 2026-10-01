import { describe, expect, it } from "vitest";
import { bench, type BenchState } from "./bench";
import { BENCH } from "./config";
import { LiftRunner, replayLift } from "./lift";
import { stepUntil, tap } from "./testHelpers";

const SEED = 12345;
const off = (s: BenchState) => Math.abs(s.pos - s.zoneCenter);
const inCentre = (s: BenchState) => s.cooldown === 0 && off(s) < 0.01;
const inZoneNotCentre = (s: BenchState) => s.cooldown === 0 && off(s) > 0.05 && off(s) < 0.1;
const farAway = (s: BenchState) => s.cooldown === 0 && off(s) > 0.3;

describe("bench", () => {
  it("scores nothing and ends at the time limit with no input", () => {
    const s = replayLift(bench, SEED, []);
    expect(s.done).toBe(true);
    expect(s.tick).toBe(BENCH.maxTicks);
    expect(s.score).toBe(0);
  });

  it("a tap in the centre of the zone is a perfect rep", () => {
    const r = new LiftRunner(bench, SEED);
    expect(stepUntil(r, inCentre)).toBe(true);
    tap(r);
    expect(r.state.outcome).toBe("perfect");
    expect(r.state.score).toBe(BENCH.startKg);
    expect(r.state.reps).toBe(1);
    expect(r.state.kg).toBe(BENCH.startKg + BENCH.perfectJump);
    expect(r.state.combo).toBe(1);
  });

  it("each perfect rep loads a bigger jump and the best rep is the score", () => {
    const r = new LiftRunner(bench, SEED);
    stepUntil(r, inCentre);
    tap(r);
    stepUntil(r, inCentre);
    tap(r);
    expect(r.state.score).toBe(BENCH.startKg + BENCH.perfectJump);
  });

  it("a tap in the zone but off-centre is a good rep with a smaller jump", () => {
    const r = new LiftRunner(bench, SEED);
    expect(stepUntil(r, inZoneNotCentre)).toBe(true);
    tap(r);
    expect(r.state.outcome).toBe("good");
    expect(r.state.score).toBe(BENCH.startKg);
    expect(r.state.kg).toBe(BENCH.startKg + BENCH.goodJump);
    expect(r.state.combo).toBe(0);
  });

  it("three misses end the set", () => {
    const r = new LiftRunner(bench, SEED);
    for (let i = 0; i < 3; i++) {
      expect(stepUntil(r, farAway)).toBe(true);
      tap(r);
    }
    expect(r.state.done).toBe(true);
    expect(r.state.misses).toBe(3);
    expect(r.state.score).toBe(0);
  });

  it("the zone shrinks and the marker speeds up each rep", () => {
    const r = new LiftRunner(bench, SEED);
    stepUntil(r, inCentre);
    tap(r);
    expect(r.state.zoneWidth).toBeCloseTo(BENCH.zoneStart - BENCH.zoneShrink);
    expect(r.state.speed).toBeCloseTo(BENCH.speedStart + BENCH.speedStep);
  });
});
