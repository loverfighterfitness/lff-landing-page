import { describe, expect, it } from "vitest";
import type { BenchState } from "./bench";
import { BENCH, DEADLIFT, MAX_EVENTS_PER_LIFT, RUN_TOKEN_TTL_MS, SQUAT, TICK_MS } from "./config";
import { LiftRunner } from "./lift";
import { LIFT_SIMS, liftSeed, replayRun } from "./run";
import { idle, stepUntil, tap } from "./testHelpers";
import type { RunLogs } from "./types";
import { checkLog, checkRun } from "./validate";

const SEED = 987654;
const ALL_TICKS = BENCH.maxTicks + SQUAT.maxTicks + DEADLIFT.maxTicks;
const empty: RunLogs = { bench: [], squat: [], deadlift: [] };

/** A real run: one perfect bench rep, then nothing. */
function liveRun() {
  const b = new LiftRunner(LIFT_SIMS.bench, liftSeed(SEED, "bench"));
  stepUntil(b, (s: BenchState) => s.cooldown === 0 && Math.abs(s.pos - s.zoneCenter) < 0.01);
  tap(b);
  idle(b, 100_000);
  const logs: RunLogs = { bench: b.events, squat: [], deadlift: [] };
  return { logs, benchScore: b.state.score, ticks: b.state.tick + SQUAT.maxTicks + DEADLIFT.maxTicks };
}

describe("replayRun", () => {
  it("scores an empty run as zero and runs every lift to its limit", () => {
    const r = replayRun(SEED, empty);
    expect(r.total).toBe(0);
    expect(r.ticks).toBe(ALL_TICKS);
  });

  it("gives each lift its own seed", () => {
    expect(liftSeed(SEED, "bench")).not.toBe(liftSeed(SEED, "squat"));
  });

  it("matches what the player saw live", () => {
    const live = liveRun();
    const r = replayRun(SEED, live.logs);
    expect(r.scores.bench).toBe(live.benchScore);
    expect(r.total).toBe(BENCH.perfectPoints);
  });
});

describe("checkLog", () => {
  it("accepts a clean log", () => {
    expect(checkLog("squat", [{ tick: 0, down: true }, { tick: 2, down: false }, { tick: 10, down: true }])).toBeNull();
  });
  it("rejects a log that starts with a release", () => {
    expect(checkLog("squat", [{ tick: 0, down: false }])).toMatch(/alternating/);
  });
  it("rejects out-of-order ticks", () => {
    expect(checkLog("squat", [{ tick: 10, down: true }, { tick: 5, down: false }])).toMatch(/order/);
  });
  it("rejects inhumanly fast presses", () => {
    expect(
      checkLog("squat", [{ tick: 0, down: true }, { tick: 1, down: false }, { tick: 3, down: true }]),
    ).toMatch(/too fast/);
  });
  it("rejects ticks past the lift's time limit", () => {
    expect(checkLog("squat", [{ tick: SQUAT.maxTicks, down: true }])).toMatch(/range/);
  });
  it("rejects absurdly long logs", () => {
    const events = Array.from({ length: MAX_EVENTS_PER_LIFT + 2 }, (_, i) => ({ tick: i * 5, down: i % 2 === 0 }));
    expect(checkLog("squat", events)).toMatch(/too many/);
  });
});

describe("checkRun", () => {
  it("accepts a genuine run played in real time", () => {
    const live = liveRun();
    const res = checkRun(SEED, live.logs, live.ticks * TICK_MS + 5000);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.total).toBe(BENCH.perfectPoints);
  });

  it("rejects a run submitted faster than it could be played", () => {
    const live = liveRun();
    const res = checkRun(SEED, live.logs, 1000);
    expect(res).toEqual({ ok: false, reason: "finished too fast" });
  });

  it("rejects a run older than the token lifetime", () => {
    const res = checkRun(SEED, empty, RUN_TOKEN_TTL_MS + 1);
    expect(res).toEqual({ ok: false, reason: "run expired" });
  });

  it("rejects a bad log in any lift", () => {
    const res = checkRun(SEED, { ...empty, deadlift: [{ tick: 0, down: false }] }, 70_000);
    expect(res.ok).toBe(false);
  });
});
