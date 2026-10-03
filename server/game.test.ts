import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.ADMIN_PASSWORD = "test-admin";
import type { TrpcContext } from "./_core/context";

vi.mock("./gameDb", () => ({
  getActiveEvent: vi.fn(),
  getCurrentEvent: vi.fn(),
  createRunToken: vi.fn().mockResolvedValue(undefined),
  getRunToken: vi.fn(),
  markRunTokenUsed: vi.fn().mockResolvedValue(true),
  insertRun: vi.fn().mockResolvedValue(undefined),
  getEventRuns: vi.fn().mockResolvedValue([]),
  listEventRunsForAdmin: vi.fn().mockResolvedValue([]),
  setRunRemoved: vi.fn().mockResolvedValue(undefined),
  startEvent: vi.fn().mockResolvedValue(undefined),
}));

import { appRouter } from "./routers";
import * as gameDb from "./gameDb";
import { rateLimitSize, resetGameRateLimits } from "./routers/game";
import { BENCH, DEADLIFT, SQUAT, TICK_MS } from "@shared/game/config";
import { LiftRunner } from "@shared/game/lift";
import { LIFT_SIMS, liftSeed } from "@shared/game/run";
import { idle, stepUntil, tap } from "@shared/game/testHelpers";
import type { BenchState } from "@shared/game/bench";

const db = vi.mocked(gameDb);
const RUN_ID = "3b241101-e2bb-4255-8caf-4136c566a962";
const SEED = 4242;
const EVENT = { id: 1, name: "Launch comp", startsAt: new Date(0), endsAt: new Date(Date.now() + 86_400_000), isActive: true, createdAt: new Date(0) };
const PLAY_MS = (BENCH.maxTicks + SQUAT.maxTicks + DEADLIFT.maxTicks) * TICK_MS;

function ctx(headers: Record<string, string> = {}): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers, ip: "1.2.3.4", url: "/api/trpc" } as unknown as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}
const publicCaller = () => appRouter.createCaller(ctx());
const adminCaller = () => appRouter.createCaller(ctx({ "x-admin-key": "test-admin" }));

function token(overrides: Partial<{ issuedAt: Date; usedAt: Date | null }> = {}) {
  return { id: RUN_ID, seed: SEED, character: "ruby", issuedAt: new Date(Date.now() - PLAY_MS - 5000), usedAt: null, ...overrides };
}

function perfectBenchLogs() {
  const b = new LiftRunner(LIFT_SIMS.bench, liftSeed(SEED, "bench"));
  stepUntil(b, (s: BenchState) => s.cooldown === 0 && Math.abs(s.pos - s.zoneCenter) < 0.01);
  tap(b);
  idle(b, 100_000);
  return { bench: b.events, squat: [], deadlift: [] };
}

const submission = (logs = perfectBenchLogs()) => ({
  runId: RUN_ID,
  handle: "@ruby.lifts",
  logs,
});

beforeEach(() => {
  vi.clearAllMocks();
  resetGameRateLimits();
  db.getActiveEvent.mockResolvedValue(EVENT);
  db.getCurrentEvent.mockResolvedValue(EVENT);
  db.getRunToken.mockResolvedValue(token());
  db.markRunTokenUsed.mockResolvedValue(true);
  db.getEventRuns.mockResolvedValue([]);
});

describe("game.startRun", () => {
  it("issues a token with a seed and says whether the comp is open", async () => {
    const res = await publicCaller().game.startRun({ character: "benny" });
    expect(res.runId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.seed).toBeGreaterThanOrEqual(0);
    expect(res.eventOpen).toBe(true);
    expect(db.createRunToken).toHaveBeenCalledWith({ id: res.runId, seed: res.seed, character: "benny" });
  });
});

describe("game.startRun rate limit", () => {
  it("allows 3000 starts per IP per hour, then rejects", async () => {
    for (let i = 0; i < 3000; i++) await publicCaller().game.startRun({ character: "levi" });
    await expect(publicCaller().game.startRun({ character: "levi" })).rejects.toThrow(/too many/i);
  });

  it("sweeps expired entries once the map passes 10,000", async () => {
    for (let i = 0; i < 10_001; i++) {
      await appRouter.createCaller(ctx({ "x-real-ip": `ip-${i}` })).game.startRun({ character: "levi" });
    }
    expect(rateLimitSize()).toBe(10_001);
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(Date.now() + 2 * 60 * 60_000);
      await publicCaller().game.startRun({ character: "levi" });
      expect(rateLimitSize()).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("game.submitRun", () => {
  it("burns the token when the replay check fails", async () => {
    db.getRunToken.mockResolvedValue(token({ issuedAt: new Date() }));
    await expect(publicCaller().game.submitRun(submission())).rejects.toThrow(/didn't check out/);
    expect(db.markRunTokenUsed).toHaveBeenCalledWith(RUN_ID);
    expect(db.insertRun).not.toHaveBeenCalled();
  });

  it("re-scores the run server-side and saves it", async () => {
    db.getEventRuns.mockResolvedValue([
      { handle: "Ruby.Lifts", character: "ruby", total: BENCH.startKg } as never,
    ]);
    const res = await publicCaller().game.submitRun(submission());
    expect(res.total).toBe(BENCH.startKg);
    expect(res.rank).toBe(1);
    expect(db.insertRun).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 1,
        handle: "ruby.lifts",
        email: "",
        character: "ruby",
        benchScore: BENCH.startKg,
        total: BENCH.startKg,
        runTokenId: RUN_ID,
        inputLog: JSON.stringify(submission().logs),
        marketingOptIn: false,
      }),
    );
  });

  it("rejects a token that was already used", async () => {
    db.getRunToken.mockResolvedValue(token({ usedAt: new Date() }));
    await expect(publicCaller().game.submitRun(submission())).rejects.toThrow(/didn't check out/);
    expect(db.insertRun).not.toHaveBeenCalled();
  });

  it("rejects a run submitted faster than it could be played", async () => {
    db.getRunToken.mockResolvedValue(token({ issuedAt: new Date() }));
    await expect(publicCaller().game.submitRun(submission())).rejects.toThrow(/didn't check out/);
  });

  it("rejects bot-speed mashing", async () => {
    const squat = Array.from({ length: 200 }, (_, i) => ({ tick: i, down: i % 2 === 0 }));
    await expect(
      publicCaller().game.submitRun(submission({ bench: [], squat, deadlift: [] })),
    ).rejects.toThrow(/didn't check out/);
  });

  it("rejects malformed logs before scoring", async () => {
    await expect(
      publicCaller().game.submitRun(
        submission({ bench: [], squat: [null], deadlift: [] } as never),
      ),
    ).rejects.toThrow();
    const { squat: _squat, ...missingSquat } = submission().logs;
    await expect(
      publicCaller().game.submitRun(submission(missingSquat as never)),
    ).rejects.toThrow();
    expect(db.getRunToken).not.toHaveBeenCalled();
  });

  it("refuses submissions when no comp is open", async () => {
    db.getActiveEvent.mockResolvedValue(null);
    await expect(publicCaller().game.submitRun(submission())).rejects.toThrow(/isn't open/);
  });

  it("rejects an invalid Instagram handle", async () => {
    await expect(publicCaller().game.submitRun({ ...submission(), handle: "not a handle!" })).rejects.toThrow();
  });

  it("rate-limits a single handle (whatever its case or @)", async () => {
    for (let i = 0; i < 30; i++) await publicCaller().game.submitRun({ ...submission(), handle: i % 2 ? "@Ruby.Lifts" : "ruby.lifts" });
    await expect(publicCaller().game.submitRun(submission())).rejects.toThrow(/too many runs/i);
  });

  it("does not rate-limit different handles from one IP", async () => {
    for (let i = 0; i < 31; i++) {
      await expect(
        publicCaller().game.submitRun({ ...submission(), handle: `player${i}` }),
      ).resolves.toBeDefined();
    }
  });
});

describe("game.leaderboard", () => {
  it("only exposes handle, lifter and total", async () => {
    db.getEventRuns.mockResolvedValue([
      { email: "secret@example.com", handle: "amy", character: "levi", total: 999 } as never,
    ]);
    const res = await publicCaller().game.leaderboard();
    expect(res.rows[0]).toEqual({ rank: 1, handle: "amy", character: "levi", total: 999 });
    expect(JSON.stringify(res)).not.toContain("secret@example.com");
  });

  it("returns an empty board when there's no event", async () => {
    db.getCurrentEvent.mockResolvedValue(null);
    const res = await publicCaller().game.leaderboard();
    expect(res.event).toBeNull();
    expect(res.rows).toEqual([]);
  });
});

describe("game.admin", () => {
  it("is locked to admins", async () => {
    await expect(publicCaller().game.admin.overview()).rejects.toThrow();
  });

  it("shows the current event's runs", async () => {
    db.listEventRunsForAdmin.mockResolvedValue([{ id: 7, email: "a@x.com" } as never]);
    const res = await adminCaller().game.admin.overview();
    expect(res.event?.name).toBe("Launch comp");
    expect(res.runs).toHaveLength(1);
  });

  it("removes and restores a run", async () => {
    await adminCaller().game.admin.setRunRemoved({ id: 7, removed: true });
    expect(db.setRunRemoved).toHaveBeenCalledWith(7, true);
  });

  it("starts an event and refuses one that ends before it starts", async () => {
    const startsAt = new Date("2026-10-10T00:00:00Z");
    const endsAt = new Date("2026-10-24T00:00:00Z");
    await adminCaller().game.admin.startEvent({ name: "Tee drop comp", startsAt, endsAt });
    expect(db.startEvent).toHaveBeenCalledWith({ name: "Tee drop comp", startsAt, endsAt });
    await expect(
      adminCaller().game.admin.startEvent({ name: "Backwards", startsAt: endsAt, endsAt: startsAt }),
    ).rejects.toThrow();
  });

  it("exports entrants as CSV", async () => {
    db.getEventRuns.mockResolvedValue([
      { handle: "amy", character: "ruby", total: 10 } as never,
    ]);
    const { csv } = await adminCaller().game.admin.entrantsCsv();
    expect(csv).toContain('"amy","ruby",10,1');
  });
});
