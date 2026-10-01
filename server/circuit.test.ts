import { describe, expect, it } from "vitest";
import { Circuit } from "@/game/circuit";
import { replayRun } from "@shared/game/run";

describe("client Circuit", () => {
  it("produces logs that the server scores identically", () => {
    const c = new Circuit(777, "benny");
    let t = 0;
    while (!c.done && t < 20_000) {
      // A scrappy human: presses every 13 ticks, holds for 40 on the deadlift.
      if (t % 13 === 0) c.setDown(true);
      if (t % 13 === (c.phase.kind === "lift" && c.phase.lift === "deadlift" ? 12 : 2)) c.setDown(false);
      c.tick();
      t++;
    }
    expect(c.done).toBe(true);
    const server = replayRun(777, c.logs());
    expect(server.scores).toEqual(c.scores());
  });
});
