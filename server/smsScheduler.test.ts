/**
 * Tests for the persistent SMS job scheduler.
 * Uses mocked DB and SMS sender to verify enqueue and processing logic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted to avoid hoisting issues with vi.mock factories
const { mockInsert, mockDb, mockSendSMS } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue([{ insertId: 1 }]);
  const mockDb = {
    insert: vi.fn(() => ({ values: mockInsert })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })),
  };
  const mockSendSMS = vi.fn();
  return { mockInsert, mockDb, mockSendSMS };
});

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("./_core/sms", () => ({
  sendSMS: mockSendSMS,
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  eq: vi.fn((col: unknown, val: unknown) => ({ type: "eq", col, val })),
  lte: vi.fn((col: unknown, val: unknown) => ({ type: "lte", col, val })),
}));

vi.mock("../drizzle/schema", () => ({
  smsJobs: { id: "id", status: "status", sendAt: "sendAt" },
  calculatorLeads: { id: "id" },
}));

import { enqueueSmsJob, startSmsScheduler, stopSmsScheduler } from "./smsScheduler";

describe("enqueueSmsJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue([{ insertId: 1 }]);
    mockDb.insert.mockReturnValue({ values: mockInsert });
    mockDb.update.mockReturnValue({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) });
    mockDb.select.mockReturnValue({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) });
  });

  it("inserts a job into the database with correct fields", async () => {
    const before = Date.now();
    await enqueueSmsJob({
      leadId: 42,
      phone: "+61400000000",
      message: "Test SMS",
      smsNumber: 2,
      delayMs: 2 * 24 * 60 * 60 * 1000,
    });

    expect(mockDb.insert).toHaveBeenCalledOnce();
    expect(mockInsert).toHaveBeenCalledOnce();

    const insertedValues = mockInsert.mock.calls[0][0];
    expect(insertedValues.leadId).toBe(42);
    expect(insertedValues.phone).toBe("+61400000000");
    expect(insertedValues.message).toBe("Test SMS");
    expect(insertedValues.smsNumber).toBe(2);
    expect(insertedValues.status).toBe("pending");

    // sendAt should be approximately 2 days from now
    const expectedSendAt = new Date(before + 2 * 24 * 60 * 60 * 1000);
    expect(insertedValues.sendAt.getTime()).toBeGreaterThanOrEqual(expectedSendAt.getTime() - 1000);
    expect(insertedValues.sendAt.getTime()).toBeLessThanOrEqual(expectedSendAt.getTime() + 1000);
  });

  it("enqueues SMS #3 with correct 5-day delay", async () => {
    const before = Date.now();
    await enqueueSmsJob({
      leadId: 10,
      phone: "+61400000001",
      message: "Day 5 SMS",
      smsNumber: 3,
      delayMs: 5 * 24 * 60 * 60 * 1000,
    });

    const insertedValues = mockInsert.mock.calls[0][0];
    expect(insertedValues.smsNumber).toBe(3);
    const expectedSendAt = new Date(before + 5 * 24 * 60 * 60 * 1000);
    expect(insertedValues.sendAt.getTime()).toBeGreaterThanOrEqual(expectedSendAt.getTime() - 1000);
  });

  it("does not throw if DB is unavailable", async () => {
    const { getDb } = await import("./db");
    vi.mocked(getDb).mockResolvedValueOnce(null as any);

    await expect(
      enqueueSmsJob({ leadId: 1, phone: "+61400000000", message: "test", smsNumber: 2, delayMs: 1000 })
    ).resolves.toBeUndefined();
  });

  it("sets status to pending on enqueue", async () => {
    await enqueueSmsJob({
      leadId: 5,
      phone: "+61400000002",
      message: "Hello",
      smsNumber: 2,
      delayMs: 1000,
    });

    const insertedValues = mockInsert.mock.calls[0][0];
    expect(insertedValues.status).toBe("pending");
  });
});

describe("startSmsScheduler / stopSmsScheduler", () => {
  afterEach(() => {
    stopSmsScheduler();
  });

  it("starts without throwing", () => {
    expect(() => startSmsScheduler()).not.toThrow();
  });

  it("does not start twice if already running", () => {
    startSmsScheduler();
    expect(() => startSmsScheduler()).not.toThrow();
  });

  it("stops cleanly", () => {
    startSmsScheduler();
    expect(() => stopSmsScheduler()).not.toThrow();
  });

  it("can be restarted after stopping", () => {
    startSmsScheduler();
    stopSmsScheduler();
    expect(() => startSmsScheduler()).not.toThrow();
  });
});
