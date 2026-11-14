/**
 * Coaching purchase → LFF Coaching app invite.
 *
 * After a coaching Checkout session completes, the webhook asks the LFF app's Supabase Edge Function
 * `coaching-purchase` to invite the buyer's email, exactly as Levi's coach-web invite does (lff-coaching-app:
 * supabase/migrations/20270129000001_purchase_invites.sql). The function holds the database key; this server holds
 * only a shared secret that can do that one thing.
 *
 * Safe to repeat: the app remembers each Stripe session, so a resent event gets the first answer back
 * (`repeat: true`) and nothing is invited or emailed twice.
 *
 * Off until both LFF_APP_INVITE_URL and LFF_APP_INVITE_SECRET are set: Levi's alert then says to invite by hand.
 */
import Stripe from "stripe";
import { ENV } from "../_core/env";
import { STRIPE_PRODUCTS } from "./products";

export const COACHING_KEYS = ["standardCoaching", "compPrepCoaching"] as const;
export type CoachingKey = (typeof COACHING_KEYS)[number];

/** The LFF Coaching app on the App Store (app id 6829430402). */
export const APP_STORE_URL = "https://apps.apple.com/app/id6829430402";

/** A coaching subscription bought on the site (createCheckoutSession / createEmbeddedCheckoutSession set product_key). */
export function coachingKeyOf(session: Pick<Stripe.Checkout.Session, "metadata">): CoachingKey | null {
  const key = session.metadata?.product_key;
  return (COACHING_KEYS as readonly string[]).includes(key ?? "") ? (key as CoachingKey) : null;
}

export type InviteOutcome =
  | { status: "off" }
  | { status: "no_email" }
  | { status: "done"; result: "invited" | "linked" | "already_linked"; repeat: boolean; setup: string | null }
  | { status: "failed"; reason: string };

export interface InviteRequest {
  sessionId: string;
  email: string | null;
  name: string | null;
  productKey: CoachingKey;
}

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

const TIMEOUT_MS = 8000;

/**
 * Calls the Edge Function, with one retry after a network error or a 5xx. Never throws: the payment alert to Levi
 * must go out whatever happens here.
 */
export async function inviteBuyerToApp(
  req: InviteRequest,
  opts: { url?: string; secret?: string; fetch?: Fetch; retryDelayMs?: number } = {}
): Promise<InviteOutcome> {
  const url = opts.url ?? ENV.appInviteUrl;
  const secret = opts.secret ?? ENV.appInviteSecret;
  if (!url || !secret) return { status: "off" };
  if (!req.email) return { status: "no_email" };
  const doFetch: Fetch = opts.fetch ?? ((u, init) => fetch(u, init));
  const body = JSON.stringify({ session_id: req.sessionId, email: req.email, name: req.name, product_key: req.productKey });

  let last = "no answer";
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, opts.retryDelayMs ?? 1500));
    try {
      const res = await doFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-purchase-secret": secret },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const json = (await res.json().catch(() => null)) as
        | { result?: string; repeat?: boolean; setup?: string | null; note?: string | null; error?: string }
        | null;
      if (res.status >= 500) {
        last = `the app's server answered ${res.status}${json?.note ? ` (${json.note})` : ""}`;
        continue;
      }
      if (!res.ok) {
        // 401 / 400: retrying can't help.
        return { status: "failed", reason: `the app refused it (${res.status} ${json?.error ?? ""})`.trim() };
      }
      if (json?.result === "invited" || json?.result === "linked" || json?.result === "already_linked") {
        return { status: "done", result: json.result, repeat: json.repeat === true, setup: json.setup ?? null };
      }
      return { status: "failed", reason: json?.note ?? "the app could not invite this email" };
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
    }
  }
  return { status: "failed", reason: last };
}

/** The line in Levi's payment alert that says whether the app invite went out. */
export function inviteLine(o: InviteOutcome, email: string): string {
  switch (o.status) {
    case "off":
      return "App invite: not switched on yet. Invite them from the coach web (Clients → Invite).";
    case "no_email":
      return "App invite: Stripe gave no email. Get their email and invite them from the coach web.";
    case "failed":
      return `App invite: DID NOT go out (${o.reason}). Invite ${email} from the coach web.`;
    case "done": {
      const again = o.repeat ? " (Stripe sent this payment again; nothing new was done.)" : "";
      const setup = o.setup ? ` They start on ${o.setup}.` : " They start on nothing yet: give them a program from the coach web.";
      if (o.result === "linked") return `App invite: done. ${email} already had an app account and is now your client.${setup}${again}`;
      if (o.result === "already_linked") return `App invite: ${email} is already your client in the app, so nothing changed.${again}`;
      return `App invite: sent. ${email} becomes your client the first time they sign in to the app with that email.${setup}${again}`;
    }
  }
}

/** True when the buyer should get the welcome email: once per session, never on Stripe's repeat of the same event. */
export function shouldWelcome(o: InviteOutcome): boolean {
  return !(o.status === "done" && o.repeat) && o.status !== "no_email";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ── Words that reach the buyer. DRAFT: Levi OKs the exact text before this goes live. ──
export const WELCOME_SUBJECT = "You're in. Here's your LFF Coaching app";

export function welcomeEmailHtml(firstName: string | null, email: string): string {
  const hey = firstName ? `Hey ${esc(firstName)} !` : "Hey !";
  return `
    <div style="background:#1a1612;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#221c16;border:1px solid rgba(234,230,210,0.12);border-radius:12px;overflow:hidden;">
        <div style="padding:28px;">
          <p style="color:rgba(234,230,210,0.45);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 10px;font-weight:600;">Lover Fighter Fitness</p>
          <p style="color:#EAE6D2;font-size:16px;line-height:1.6;margin:0 0 14px;">${hey}</p>
          <p style="color:rgba(234,230,210,0.85);font-size:15px;line-height:1.6;margin:0 0 14px;">Welcome to LFF. Your coaching runs through the LFF Coaching app: your program, check-ins, food and messages with me, all in one place.</p>
          <p style="color:rgba(234,230,210,0.85);font-size:15px;line-height:1.6;margin:0 0 6px;"><strong style="color:#EAE6D2;">1.</strong> Download LFF Coaching from the App Store.</p>
          <p style="color:rgba(234,230,210,0.85);font-size:15px;line-height:1.6;margin:0 0 6px;"><strong style="color:#EAE6D2;">2.</strong> Sign in with this email: <strong style="color:#EAE6D2;">${esc(email)}</strong></p>
          <p style="color:rgba(234,230,210,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;"><strong style="color:#EAE6D2;">3.</strong> I'll be in touch within 24 hours to get your program built.</p>
          <a href="${APP_STORE_URL}" style="display:inline-block;background:rgba(234,230,210,0.95);color:#54412F;padding:12px 24px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">Get the app</a>
          <p style="color:rgba(234,230,210,0.55);font-size:13px;line-height:1.6;margin:20px 0 0;">Using a different email in the app? Just reply and tell me which one.</p>
          <p style="color:rgba(234,230,210,0.85);font-size:15px;line-height:1.6;margin:16px 0 0;">Levi</p>
        </div>
      </div>
    </div>`;
}

/** Levi's own alert email for a coaching payment, with the invite line. */
export function coachingAlertHtml(a: {
  productName: string;
  customerName: string;
  customerEmail: string;
  amountPaid: string;
  inviteLine: string;
  sessionId: string;
}): string {
  const row = (label: string, value: string) =>
    `<p style="color:rgba(234,230,210,0.45);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:14px 0 4px;font-weight:600;">${label}</p>
     <p style="color:#EAE6D2;font-size:14px;margin:0;line-height:1.5;">${esc(value)}</p>`;
  return `
    <div style="background:#1a1612;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#221c16;border:1px solid rgba(234,230,210,0.12);border-radius:12px;padding:24px 28px;">
        <h1 style="color:#EAE6D2;font-size:20px;margin:0;font-weight:700;">New client · ${esc(a.productName)}</h1>
        ${row("Client", `${a.customerName} · ${a.customerEmail}`)}
        ${row("Paid", a.amountPaid)}
        ${row("App", a.inviteLine)}
        ${row("Stripe session", a.sessionId)}
        <p style="color:rgba(234,230,210,0.55);font-size:12px;margin:18px 0 0;">Reach out within 24 hours.</p>
      </div>
    </div>`;
}

/**
 * The coaching product of a completed session, by either route: the site's own checkout (metadata.product_key), or a
 * coaching Payment Link (no metadata; found by its subscription's price). Shop and program orders are one-off
 * payments, so a session that isn't a subscription is never coaching and costs no Stripe call.
 */
export async function resolveCoachingKey(
  stripe: Pick<Stripe, "checkout">,
  session: Pick<Stripe.Checkout.Session, "id" | "metadata" | "mode">
): Promise<CoachingKey | null> {
  const direct = coachingKeyOf(session);
  if (direct) return direct;
  if (session.mode !== "subscription") return null;
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
    const prices = items.data.map((i) => i.price?.id);
    return COACHING_KEYS.find((k) => prices.includes(STRIPE_PRODUCTS[k].priceId)) ?? null;
  } catch (err) {
    console.error("[Webhook] Could not read a subscription's line items:", err);
    return null;
  }
}
