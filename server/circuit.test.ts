import { describe, expect, it } from "vitest";
import { Circuit } from "@/game/circuit";
import type { BenchState } from "@shared/game/bench";
import type { DeadliftState } from "@shared/game/deadlift";
import { replayRun } from "@shared/game/run";

describe("client Circuit", () => {
  it("produces logs that the server scores identically", () => {
    const c = new Circuit(777, "benny");
    let t = 0;
    let lastLift = "";
    let phaseTick = 0;
    while (!c.done && t < 60_000) {
      const p = c.phase;
      if (p.kind === "lift") {
        if (p.lift !== lastLift) {
          lastLift = p.lift;
          phaseTick = 0;
        }
        if (p.lift === "bench") {
          // Tap when the marker is near the zone centre.
          const s = c.current?.state as BenchState;
          c.setDown(s.cooldown === 0 && Math.abs(s.pos - s.zoneCenter) < 0.03);
        } else if (p.lift === "deadlift") {
          // Hold until the gauge is in the sweet spot, then release.
          const s = c.current?.state as DeadliftState;
          c.setDown(s.cooldown === 0 && !(s.pulling && s.gauge >= 0.8));
        } else {
          // A scrappy human: presses every 13 ticks.
          c.setDown(phaseTick % 13 < 2);
        }
        phaseTick++;
      }
      c.tick();
      t++;
    }
    expect(c.done).toBe(true);
    const scores = c.scores();
    expect(scores.bench).toBeGreaterThan(0);
    expect(scores.squat).toBeGreaterThan(0);
    expect(scores.deadlift).toBeGreaterThan(0);
    const server = replayRun(777, c.logs());
    expect(server.scores).toEqual(scores);
  });
});
