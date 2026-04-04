import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

describe("Gmail SMTP credentials", () => {
  it("should verify Gmail app password is set in env", () => {
    const password = process.env.GMAIL_APP_PASSWORD;
    expect(password, "GMAIL_APP_PASSWORD must be set").toBeTruthy();
    expect(password!.length, "Gmail App Password should be 16 chars (spaces optional)").toBeGreaterThanOrEqual(16);
  });

  it("should create a valid nodemailer transporter", async () => {
    const password = process.env.GMAIL_APP_PASSWORD;
    if (!password) {
      console.warn("Skipping SMTP test — GMAIL_APP_PASSWORD not set");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "loverfighterfitness@gmail.com",
        pass: password,
      },
    });

    // Verify the connection/credentials
    await expect(transporter.verify()).resolves.toBe(true);
  }, 15000);
});
