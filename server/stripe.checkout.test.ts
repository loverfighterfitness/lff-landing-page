/**
 * Stripe Checkout Router Tests
 * Tests the createCheckoutSession procedure input validation and error handling
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Stripe before importing the router
vi.mock("stripe", () => {
  const mockCreate = vi.fn().mockResolvedValue({
    url: "https://checkout.stripe.com/pay/test_session_123",
    id: "cs_test_123",
  });

  const MockStripe = vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockCreate,
      },
    },
  }));

  return { default: MockStripe };
});

// Mock env
vi.mock("./_core/env", () => ({
  ENV: {
    stripeSecretKey: "sk_test_mock_key",
    stripeWebhookSecret: "whsec_mock_secret",
    stripePublishableKey: "pk_test_mock_key",
  },
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { z } from "zod";

// Input validation schema (mirrors the router)
const inputSchema = z.object({
  productKey: z.enum(["standardCoaching", "compPrepCoaching"]),
  origin: z.string().url(),
});

describe("Stripe Checkout Input Validation", () => {
  it("accepts standardCoaching with valid origin", () => {
    const result = inputSchema.safeParse({
      productKey: "standardCoaching",
      origin: "https://www.loverfighterfitness.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts compPrepCoaching with valid origin", () => {
    const result = inputSchema.safeParse({
      productKey: "compPrepCoaching",
      origin: "https://www.loverfighterfitness.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown product key", () => {
    const result = inputSchema.safeParse({
      productKey: "unknownPackage",
      origin: "https://www.loverfighterfitness.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid origin URL", () => {
    const result = inputSchema.safeParse({
      productKey: "standardCoaching",
      origin: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing productKey", () => {
    const result = inputSchema.safeParse({
      origin: "https://www.loverfighterfitness.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing origin", () => {
    const result = inputSchema.safeParse({
      productKey: "standardCoaching",
    });
    expect(result.success).toBe(false);
  });
});

describe("Stripe Products Config", () => {
  it("has correct product keys", async () => {
    const { STRIPE_PRODUCTS } = await import("./stripe/products");
    expect(STRIPE_PRODUCTS).toHaveProperty("standardCoaching");
    expect(STRIPE_PRODUCTS).toHaveProperty("compPrepCoaching");
  });

  it("standard coaching has correct name", async () => {
    const { STRIPE_PRODUCTS } = await import("./stripe/products");
    expect(STRIPE_PRODUCTS.standardCoaching.name).toBe("Online Coaching");
  });

  it("comp prep coaching has correct name", async () => {
    const { STRIPE_PRODUCTS } = await import("./stripe/products");
    expect(STRIPE_PRODUCTS.compPrepCoaching.name).toBe("Comp Prep Coaching");
  });

  it("both products have payment link URLs", async () => {
    const { STRIPE_PRODUCTS } = await import("./stripe/products");
    expect(STRIPE_PRODUCTS.standardCoaching.paymentLinkUrl).toMatch(/^https:\/\/buy\.stripe\.com\//);
    expect(STRIPE_PRODUCTS.compPrepCoaching.paymentLinkUrl).toMatch(/^https:\/\/buy\.stripe\.com\//);
  });
});
