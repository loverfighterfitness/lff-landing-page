/**
 * Coaching purchase → LFF Coaching app invite. The webhook is driven with real Stripe-signed test events (a test
 * signing secret, no network, no charges); the app's Edge Function and email are stand-ins.
 */
import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const WEBHOOK_SECRET = "whsec_test_secret_for_unit_tests_only";

vi.mock("../_core/env", () => ({
  ENV: {
    stripeSecretKey: "sk_test_unit_tests_only",
    stripeWebhookSecret: "whsec_test_secret_for_unit_tests_only",
    gmailUser: "levi@example.com",
    appInviteUrl: "https://app.example.com/functions/v1/coaching-purchase",
    appInviteSecret: "a-long-shared-secret-0123456789",
    siteUrl: "https://www.example.com",
  },
}));

const sent: { to: string; subject: string; html: string }[] = [];
vi.mock("../_core/email", () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; html: string }) => {
    sent.push(m);
    return true;
  }),
}));
vi.mock("../_core/notification", () => ({ notifyOwner: vi.fn(async () => true) }));
vi.mock("../_core/push", () => ({ sendPushNotification: vi.fn() }));
vi.mock("../program/delivery", () => ({ deliverProgram: vi.fn() }));
vi.mock("../db", () => ({ getDb: vi.fn(async () => null) }));

const { handleStripeWebhook, handleSubscriptionEnded } = await import("./webhook");
const {
  APP_STORE_URL,
  coachingKeyOf,
  inviteBuyerToApp,
  inviteLine,
  resolveCoachingKey,
  shouldWelcome,
  welcomeEmailHtml,
} = await import("./appInvite");
const { STRIPE_PRODUCTS } = await import("./products");

const SESSION_ID = "cs_test_a1B2c3D4e5F6g7H8";

function coachingSession(over: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: SESSION_ID,
    object: "checkout.session",
    mode: "subscription",
    payment_link: null,
    amount_total: 8000,
    customer_details: { email: "sam@example.com", name: "Sam Smith" },
    metadata: { product_key: "standardCoaching", product_name: "Online Coaching", referral_code: "", promo_code: "" },
    ...over,
  } as unknown as Stripe.Checkout.Session;
}

/** A Stripe-signed delivery of `object` as `type`, through the real handler. */
async function deliver(type: string, object: unknown, id = "evt_1Unit00000000000000") {
  const payload = JSON.stringify({ id, object: "event", type, data: { object } });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  const res = { statusCode: 200, body: undefined as unknown, status(c: number) { this.statusCode = c; return this; }, json(b: unknown) { this.body = b; return this; }, send(b: unknown) { this.body = b; return this; } };
  await handleStripeWebhook({ headers: { "stripe-signature": header }, body: Buffer.from(payload) } as never, res as never);
  return res;
}

type Call = { url: string; headers: Record<string, string>; body: Record<string, unknown> };
let calls: Call[] = [];
let answers: (() => Response)[] = [];

beforeEach(() => {
  sent.length = 0;
  calls = [];
  answers = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    const next = answers.shift();
    if (!next) throw new Error("no answer queued");
    return next();
  });
});

const answer = (body: unknown, status = 200) => () => new Response(JSON.stringify(body), { status });

describe("coaching purchase webhook", () => {
  it("invites the buyer, welcomes them with the App Store link, and tells Levi the invite went out", async () => {
    answers.push(answer({ result: "invited", repeat: false, setup: null, note: null }));
    const res = await deliver("checkout.session.completed", coachingSession());
    expect(res.statusCode).toBe(200);
    expect(calls).toEqual([
      {
        url: "https://app.example.com/functions/v1/coaching-purchase",
        headers: { "Content-Type": "application/json", "x-purchase-secret": "a-long-shared-secret-0123456789" },
        body: { session_id: SESSION_ID, email: "sam@example.com", name: "Sam Smith", product_key: "standardCoaching" },
      },
    ]);
    const welcome = sent.find((m) => m.to === "sam@example.com");
    expect(welcome?.html).toContain(APP_STORE_URL);
    expect(welcome?.html).toContain("Hey Sam !");
    expect(welcome?.html).toContain("sam@example.com");
    expect(welcome?.html).not.toMatch(/hubfit/i);
    const alert = sent.find((m) => m.to === "levi@example.com");
    expect(alert?.subject).toBe("New client · Online Coaching · Sam Smith");
    expect(alert?.html).toContain("App invite: sent.");
  });

  it("does nothing twice when Stripe sends the same payment again", async () => {
    answers.push(answer({ result: "invited", repeat: true, setup: null, note: null }));
    await deliver("checkout.session.completed", coachingSession());
    expect(sent.map((m) => m.to)).toEqual(["levi@example.com"]);
    expect(sent[0].subject).toMatch(/^\[Repeat\] /);
  });

  it("still alerts Levi, marked to invite by hand, when the app can't be reached (after one retry)", async () => {
    answers.push(() => { throw new Error("ECONNRESET"); }, () => { throw new Error("ECONNRESET"); });
    const res = await deliver("checkout.session.completed", coachingSession());
    expect(res.statusCode).toBe(200);
    expect(calls).toHaveLength(2);
    const alert = sent.find((m) => m.to === "levi@example.com");
    expect(alert?.subject).toMatch(/^\[Invite by hand\] New client/);
    expect(alert?.html).toContain("DID NOT go out");
  }, 10_000);

  it("finds Comp Prep bought through a coaching Payment Link (no metadata), instead of calling it a shop order", async () => {
    answers.push(answer({ result: "linked", repeat: false, setup: null, note: null }));
    const session = coachingSession({ metadata: {}, payment_link: "plink_123" });
    const stripe = { checkout: { sessions: { listLineItems: vi.fn(async () => ({ data: [{ price: { id: STRIPE_PRODUCTS.compPrepCoaching.priceId } }] })) } } };
    expect(await resolveCoachingKey(stripe as never, session)).toBe("compPrepCoaching");
    expect(await resolveCoachingKey(stripe as never, { ...session, mode: "payment" })).toBeNull();
  });

  it("alerts Levi when a coaching subscription ends, and locks nothing", async () => {
    const sub = { id: "sub_1", object: "subscription", customer: "cus_1", items: { data: [{ price: { id: STRIPE_PRODUCTS.standardCoaching.priceId } }] } };
    const stripe = { customers: { retrieve: vi.fn(async () => ({ name: "Sam Smith", email: "sam@example.com" })) } };
    await handleSubscriptionEnded(stripe as never, sub as never);
    await handleSubscriptionEnded(stripe as never, { ...sub, items: { data: [{ price: { id: "price_socks" } }] } } as never);
    expect(calls).toEqual([]);
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toBe("Coaching ended · Online Coaching");
    expect(sent[0].html).toContain("Their app still works");
  });

  it("refuses an unsigned event", async () => {
    const res = { statusCode: 200, status(c: number) { this.statusCode = c; return this; }, send() { return this; }, json() { return this; } };
    await handleStripeWebhook({ headers: { "stripe-signature": "t=1,v1=bad" }, body: Buffer.from("{}") } as never, res as never);
    expect(res.statusCode).toBe(400);
    expect(calls).toEqual([]);
  });
});

describe("inviteBuyerToApp", () => {
  const req = { sessionId: SESSION_ID, email: "sam@example.com", name: "Sam", productKey: "standardCoaching" as const };

  it("is off until both the URL and the secret are set", async () => {
    expect(await inviteBuyerToApp(req, { url: "", secret: "x" })).toEqual({ status: "off" });
    expect(await inviteBuyerToApp(req, { url: "https://x", secret: "" })).toEqual({ status: "off" });
    expect(calls).toEqual([]);
  });

  it("does not retry a refusal, and retries a 5xx once", async () => {
    answers.push(answer({ error: "unauthorized" }, 401));
    expect(await inviteBuyerToApp(req)).toEqual({ status: "failed", reason: "the app refused it (401 unauthorized)" });
    answers.push(answer({ error: "server_error" }, 500), answer({ result: "already_linked", repeat: false, setup: null }));
    expect(await inviteBuyerToApp(req, { retryDelayMs: 1 })).toEqual({ status: "done", result: "already_linked", repeat: false, setup: null });
    expect(calls).toHaveLength(3);
  });

  it("passes on the database's reason for a failed invite", async () => {
    answers.push(answer({ result: "failed", repeat: false, setup: null, note: "that is your own email" }));
    expect(await inviteBuyerToApp(req)).toEqual({ status: "failed", reason: "that is your own email" });
  });

  it("needs an email", async () => {
    expect(await inviteBuyerToApp({ ...req, email: null })).toEqual({ status: "no_email" });
  });
});

describe("words", () => {
  it("says plainly what happened in Levi's alert", () => {
    expect(inviteLine({ status: "done", result: "linked", repeat: false, setup: "Online Coaching package" }, "a@b.co")).toBe(
      "App invite: done. a@b.co already had an app account and is now your client. They start on Online Coaching package."
    );
    expect(inviteLine({ status: "off" }, "a@b.co")).toMatch(/not switched on yet/);
  });

  it("welcomes once per payment", () => {
    expect(shouldWelcome({ status: "done", result: "invited", repeat: false, setup: null })).toBe(true);
    expect(shouldWelcome({ status: "done", result: "invited", repeat: true, setup: null })).toBe(false);
    expect(shouldWelcome({ status: "failed", reason: "x" })).toBe(true);
    expect(shouldWelcome({ status: "off" })).toBe(true);
  });

  it("escapes the buyer's name and has no prices or HubFit", () => {
    const html = welcomeEmailHtml("<b>Sam</b>", "sam@example.com");
    expect(html).toContain("Hey &lt;b&gt;Sam&lt;/b&gt; !");
    expect(html).not.toMatch(/hubfit|\$\d/i);
    expect(welcomeEmailHtml(null, "sam@example.com")).toContain("Hey !");
  });

  it("only treats the two coaching products as coaching", () => {
    expect(coachingKeyOf({ metadata: { product_key: "compPrepCoaching" } })).toBe("compPrepCoaching");
    expect(coachingKeyOf({ metadata: { product_key: "socksCream" } })).toBeNull();
    expect(coachingKeyOf({ metadata: null })).toBeNull();
  });
});
