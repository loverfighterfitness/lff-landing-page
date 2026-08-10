/**
 * SINGLE SOURCE OF TRUTH for Stripe payment links.
 *
 * These are used for Instagram in-app browser checkouts (WKWebView blocks
 * the normal server-created checkout redirect) and one-click product buys.
 *
 * ⚠️ Do NOT copy these URLs into components — import resolvePaymentLink.
 * Having three duplicated maps is how the GOAT pack ended up charging
 * $45 (tee price) for weeks. One map, one resolver, no drift.
 *
 * Every resolved link carries the cart item id (e.g. "tee-brown-L") as
 * client_reference_id so the webhook/backfill can record colour + size
 * and decrement stock (see server/stripe/paymentLinkItems.ts).
 */

export const PAYMENT_LINKS: Record<string, string> = {
  "socks-cream":    "https://buy.stripe.com/cNi8wPaYO4rtdZO1cQbwk06",
  "socks-brown":    "https://buy.stripe.com/dRm8wP7MC0bd08Y1cQbwk07",
  "lifting-straps": "https://buy.stripe.com/dRm8wP8QG9LN1d23kYbwk08",
  "cuffs":          "https://buy.stripe.com/7sY4gz4Aq7DF8Fu1cQbwk09",
  "goat-pack":      "https://buy.stripe.com/8x25kD2siaPR7Bq4p2bwk0l", // $99 bundle
};

// Tee ids are dynamic ("tee-{colour}-{size}", "tee-3-pack-{sizes}") so they
// resolve by prefix. Order matters: 3-pack before single tee.
const TEE_3_PACK_LINK = "https://buy.stripe.com/5kQ00j9UK3np2h61cQbwk0m";
const TEE_LINK        = "https://buy.stripe.com/cNi3cv9UKe236xm9Jmbwk0a";

/**
 * The Hypertrophy Meta ($60 one-off download). Not a shop cart item, so it
 * lives outside PAYMENT_LINKS and carries no client_reference_id — but it's
 * here so every Stripe link in the app stays in one file.
 *
 * The link redirects to /program?checkout=success&session_id={CHECKOUT_SESSION_ID},
 * which is what the success page needs to verify the purchase and hand over
 * the download. Sessions created this way have EMPTY metadata, so the server
 * identifies them by payment link id instead — see STRIPE_PRODUCTS.programMeta
 * in server/stripe/products.ts. Change one, change the other.
 */
export const PROGRAM_PAYMENT_LINK = "https://buy.stripe.com/8x29AT4Aq7DF4pe2gUbwk0o";

/** True when running inside Instagram's in-app browser (WKWebView), which
 *  blocks JS-driven navigation to external domains — real <a> tags only. */
export function isInstagramBrowser(): boolean {
  return typeof navigator !== "undefined" && /Instagram/i.test(navigator.userAgent);
}

/**
 * Resolve a cart item id to its payment link with the id attached as
 * client_reference_id. Returns null when the product has no payment link
 * (multi-item carts must use the server checkout).
 */
export function resolvePaymentLink(id: string): string | null {
  const base =
    PAYMENT_LINKS[id] ??
    (id.startsWith("tee-3-pack")
      ? TEE_3_PACK_LINK
      : id.startsWith("tee-")
        ? TEE_LINK
        : null);
  return base ? `${base}?client_reference_id=${encodeURIComponent(id)}` : null;
}
