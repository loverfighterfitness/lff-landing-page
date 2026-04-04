import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock storagePut so tests don't hit real S3
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "lff-media/test-file.jpg",
    url: "https://cdn.example.com/lff-media/test-file.jpg",
  }),
}));

// Mock getDb so tests don't need a real DB
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([
          {
            id: 1,
            fileKey: "lff-media/test-file.jpg",
            url: "https://cdn.example.com/lff-media/test-file.jpg",
            filename: "test-file.jpg",
            mimeType: "image/jpeg",
            fileSize: 12345,
            label: "hero",
            uploadedBy: 1,
            createdAt: new Date(),
          },
        ]),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}));

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "levi@lff.com",
      name: "Levi Hurst",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("storage.list", () => {
  it("returns assets for admin users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.storage.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("url");
    expect(result[0]).toHaveProperty("filename");
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.storage.list()).rejects.toThrow();
  });
});

describe("storage.upload", () => {
  it("uploads a file and returns URL for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.storage.upload({
      filename: "test-image.jpg",
      mimeType: "image/jpeg",
      data: Buffer.from("fake image data").toString("base64"),
      fileSize: 15,
      label: "test",
    });
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("filename", "test-image.jpg");
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.storage.upload({
        filename: "test.jpg",
        mimeType: "image/jpeg",
        data: "abc",
        fileSize: 3,
      })
    ).rejects.toThrow();
  });
});

describe("storage.delete", () => {
  it("deletes an asset for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.storage.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.storage.delete({ id: 1 })).rejects.toThrow();
  });
});
