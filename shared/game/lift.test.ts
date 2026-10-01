import { describe, expect, it } from "vitest";
import { award, comboMultiplier } from "./combo";
import { LiftRunner, replayLift, type LiftSim, type LiftStateBase } from "./lift";
import { randAt } from "./rng";

interface CountState extends LiftStateBase {
  presses: number;
}

const counter: LiftSim<CountState> = {
  id: "bench",
  maxTicks: 100,
  init: () => ({ tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0, presses: 0 }),
  step(s, input) {
    if (input.pressed) {
      s.presses++;
      s.score += 10;
    }
  },
};

describe("randAt", () => {
  it("is deterministic and within [0, 1)", () => {
    expect(randAt(42, 3)).toBe(randAt(42, 3));
    for (let i = 0; i < 100; i++) {
      const v = randAt(7, i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("changes with the index and the seed", () => {
    expect(randAt(42, 0)).not.toBe(randAt(42, 1));
    expect(randAt(42, 0)).not.toBe(randAt(43, 0));
  });
});

describe("combo", () => {
  it("adds 10% per combo step and caps at 2x", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(3)).toBeCloseTo(1.3);
    expect(comboMultiplier(50)).toBe(2);
    expect(award(200, 1)).toBe(220);
  });
});

describe("LiftRunner", () => {
  it("records input changes stamped with the tick they apply from", () => {
    const r = new LiftRunner(counter, 1);
    r.advance();
    r.advance();
    r.setDown(true);
    r.advance();
    r.setDown(false);
    r.advance();
    expect(r.events).toEqual([
      { tick: 2, down: true },
      { tick: 3, down: false },
    ]);
    expect(r.state.presses).toBe(1);
  });

  it("ignores a press that comes too soon after the last one", () => {
    const r = new LiftRunner(counter, 1);
    r.setDown(true);
    r.advance();
    r.setDown(false);
    r.advance();
    r.setDown(true); // tick 2: only 2 ticks after the first press
    r.advance();
    r.setDown(false);
    r.advance();
    expect(r.state.presses).toBe(1);
    expect(r.events).toHaveLength(2);
  });

  it("finishes at maxTicks and ignores input after", () => {
    const r = new LiftRunner(counter, 1);
    for (let i = 0; i < 150; i++) r.advance();
    expect(r.done).toBe(true);
    expect(r.state.tick).toBe(100);
    r.setDown(true);
    expect(r.events).toHaveLength(0);
  });

  it("replay reproduces a live run exactly", () => {
    const live = new LiftRunner(counter, 1);
    while (!live.done) {
      const t = live.state.tick;
      if (t % 7 === 0) live.setDown(true);
      if (t % 7 === 1) live.setDown(false);
      live.advance();
    }
    const replayed = replayLift(counter, 1, live.events);
    expect(replayed.presses).toBe(live.state.presses);
    expect(replayed.score).toBe(live.state.score);
    expect(replayed.tick).toBe(live.state.tick);
    expect(live.state.presses).toBeGreaterThan(10);
  });
});
