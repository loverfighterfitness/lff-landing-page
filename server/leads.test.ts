import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// Mock DB and notification so tests run without a real database
vi.mock("./db", () => ({
  insertLead: vi.fn().mockResolvedValue(undefined),
  getLeads: vi.fn().mockResolvedValue([]),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { appRouter } from "./routers";
import { insertLead, getLeads } from "./db";
import { notifyOwner } from "./_core/notification";

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "levi@lff.com",
      name: "Levi",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("leads.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a valid lead with phone and notifies owner", async () => {
    const caller = appRouter.createCaller(createPublicCtx());

    const result = await caller.leads.submit({
      name: "Ruby Smith",
      phone: "0412 345 678",
      goal: "comp_prep",
      message: "Looking to do my first comp",
    });

    expect(result).toEqual({ success: true });
    expect(insertLead).toHaveBeenCalledOnce();
    expect(insertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ruby Smith",
        phone: "0412 345 678",
        goal: "comp_prep",
        message: "Looking to do my first comp",
        source: "landing_page",
      })
    );
    expect(notifyOwner).toHaveBeenCalledOnce();
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Lead: Ruby Smith",
      })
    );
  });

  it("notification content includes phone number", async () => {
    const caller = appRouter.createCaller(createPublicCtx());

    await caller.leads.submit({
      name: "Jake Brown",
      phone: "0487 654 321",
      goal: "build_muscle",
    });

    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("0487 654 321"),
      })
    );
  });

  it("saves a lead without an optional message", async () => {
    const caller = appRouter.createCaller(createPublicCtx());

    const result = await caller.leads.submit({
      name: "Jake Brown",
      phone: "0487654321",
      goal: "build_muscle",
    });

    expect(result).toEqual({ success: true });
    expect(insertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        message: null,
      })
    );
  });

  it("rejects phone number that is too short", async () => {
    const caller = appRouter.createCaller(createPublicCtx());

    await expect(
      caller.leads.submit({
        name: "Test User",
        phone: "123",
        goal: "strength",
      })
    ).rejects.toThrow();
  });

  it("rejects name that is too short", async () => {
    const caller = appRouter.createCaller(createPublicCtx());

    await expect(
      caller.leads.submit({
        name: "A",
        phone: "0412345678",
        goal: "general_fitness",
      })
    ).rejects.toThrow();
  });

  it("throws INTERNAL_SERVER_ERROR when DB insert fails", async () => {
    vi.mocked(insertLead).mockRejectedValueOnce(new Error("DB connection failed"));
    const caller = appRouter.createCaller(createPublicCtx());

    await expect(
      caller.leads.submit({
        name: "Test User",
        phone: "0412345678",
        goal: "lose_weight",
      })
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("leads.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to list leads", async () => {
    const mockLeads = [
      {
        id: 1,
        name: "Ruby Smith",
        phone: "0412 345 678",
        goal: "comp_prep" as const,
        message: null,
        source: "landing_page",
        createdAt: new Date(),
      },
    ];
    vi.mocked(getLeads).mockResolvedValueOnce(mockLeads);

    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.leads.list();

    expect(result).toEqual(mockLeads);
    expect(getLeads).toHaveBeenCalledOnce();
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserCtx());

    await expect(caller.leads.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicCtx());

    await expect(caller.leads.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
