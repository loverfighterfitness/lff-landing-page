import { describe, it, expect } from "vitest";
import webpush from "web-push";
import dotenv from "dotenv";
dotenv.config();

describe("VAPID Keys", () => {
  it("should have valid VAPID public and private keys set", () => {
    const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
    const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";

    expect(publicKey).toBeTruthy();
    expect(privateKey).toBeTruthy();

    // VAPID public keys are base64url-encoded and ~87 chars
    expect(publicKey.length).toBeGreaterThan(80);
    expect(privateKey.length).toBeGreaterThan(40);

    // Should not throw when setting VAPID details
    expect(() => {
      webpush.setVapidDetails(
        "mailto:loverfighterfitness@gmail.com",
        publicKey,
        privateKey
      );
    }).not.toThrow();
  });
});
