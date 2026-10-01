import { describe, expect, it } from "vitest";
import { award, comboMultiplier } from "./combo";
import { MAX_EVENTS_PER_LIFT } from "./config";
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

  it("ignores repeated down presses while swallowing until release, then accepts after MIN_PRESS_GAP_TICKS", () => {
    const r = new LiftRunner(counter, 1);

    // Press at tick 0 (accepted)
    r.setDown(true); // tick 0
    r.advance(); // tick 1
    expect(r.events).toEqual([{ tick: 0, down: true }]);
    expect(r.state.presses).toBe(1);

    // Release at tick 1
    r.setDown(false); // tick 1
    r.advance(); // tick 2
    expect(r.events).toEqual([
      { tick: 0, down: true },
      { tick: 1, down: false },
    ]);
    expect(r.state.presses).toBe(1);

    // Press at tick 2 (swallowed: 2 - 0 = 2 < 5)
    r.setDown(true); // tick 2
    r.advance(); // tick 3
    expect(r.events).toHaveLength(2); // still just the first press-release
    expect(r.state.presses).toBe(1);

    // Advance to tick 7 without releasing (will be tick 7 after this advance)
    for (let i = 0; i < 4; i++) r.advance(); // tick 4, 5, 6, 7
    expect(r.state.tick).toBe(7);

    // Call setDown(true) again at tick 7 (must be ignored: 7 - 0 >= 5 but swallowing is true)
    r.setDown(true); // tick 7, should be ignored by swallowing guard
    expect(r.events).toHaveLength(2); // still just 2 events
    expect(r.state.presses).toBe(1);

    // Release clears swallowing but records nothing (no down to match)
    r.setDown(false); // tick 7
    expect(r.events).toHaveLength(2); // still 2, release not recorded because swallowing suppressed the down
    expect(r.state.presses).toBe(1);

    // Advance a few ticks
    for (let i = 0; i < 3; i++) r.advance(); // tick 8, 9, 10
    expect(r.state.tick).toBe(10);

    // Now press again (gap from original press at 0 is 10, well over 5)
    r.setDown(true); // tick 10
    expect(r.events).toHaveLength(3); // should now record this press
    expect(r.events[2]).toEqual({ tick: 10, down: true });

    // Advance to trigger the press counting
    r.advance(); // tick 11
    expect(r.state.presses).toBe(2); // press is counted on advance after setDown(true)

    // Release
    r.setDown(false); // tick 11
    r.advance(); // tick 12
    expect(r.events).toHaveLength(4);
    expect(r.events[3]).toEqual({ tick: 11, down: false });
    expect(r.events[r.events.length - 1].down).toBe(false);
    expect(r.state.presses).toBe(2);
  });

  it("caps events at MAX_EVENTS_PER_LIFT and always ends with release", () => {
    const largeSim: LiftSim<CountState> = {
      id: "bench",
      maxTicks: 20000,
      init: () => ({ tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0, presses: 0 }),
      step(s, input) {
        if (input.pressed) {
          s.presses++;
          s.score += 10;
        }
      },
    };

    const r = new LiftRunner(largeSim, 1);

    // Spam taps every 10 ticks (5 ticks apart press/release meets MIN_PRESS_GAP_TICKS)
    while (!r.done) {
      if (r.state.tick % 10 === 0) r.setDown(true);
      if (r.state.tick % 10 === 5) r.setDown(false);
      r.advance();
    }

    expect(r.events.length).toBeLessThanOrEqual(MAX_EVENTS_PER_LIFT);
    if (r.events.length > 0) {
      expect(r.events[r.events.length - 1].down).toBe(false);
    }
  });
});
