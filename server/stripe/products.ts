/**
 * LFF Stripe Products
 * Maps package names to Stripe payment link IDs for checkout sessions
 */

export const STRIPE_PRODUCTS = {
  standardCoaching: {
    name: "Online Coaching",
    description: "Full-service online coaching — $80/week",
    priceId: "price_1T7vYLELc7CqpluZxV5Q5X51",
    paymentLinkUrl: "https://buy.stripe.com/3cI00j4Aq0bdf3S08Mbwk04",
  },
  compPrepCoaching: {
    name: "Comp Prep Coaching",
    description: "Competition prep coaching — $120/week",
    priceId: "price_1T7vboELc7CqpluZc8Vcr08B",
    paymentLinkUrl: "https://buy.stripe.com/3cI9AT9UK7DFaNC1cQbwk05",
  },
  socksCream: {
    name: "LFF Crew Socks — Cream",
    description: "Lover Fighter Fitness crew socks in cream — $10",
    priceId: "price_1TJP0dELc7CqpluZ2XgJcnke",
    paymentLinkUrl: "https://buy.stripe.com/cNi8wPaYO4rtdZO1cQbwk06",
  },
  socksBrown: {
    name: "LFF Crew Socks — Brown",
    description: "Lover Fighter Fitness crew socks in brown — $10",
    priceId: "price_1TJP0eELc7CqpluZeQeIQm3B",
    paymentLinkUrl: "https://buy.stripe.com/dRm8wP7MC0bd08Y1cQbwk07",
  },
  liftingStraps: {
    name: "LFF Lifting Straps",
    description: "Lover Fighter Fitness lifting straps — $35",
    priceId: "price_1TJP0fELc7CqpluZACOnKwEj",
    paymentLinkUrl: "https://buy.stripe.com/dRm8wP8QG9LN1d23kYbwk08",
  },
  cuffs: {
    name: "LFF Wrist Cuffs",
    description: "Lover Fighter Fitness wrist cuffs — $25",
    priceId: "price_1TJP0gELc7CqpluZtNGU2oTn",
    paymentLinkUrl: "https://buy.stripe.com/7sY4gz4Aq7DF8Fu1cQbwk09",
  },
  dropShoulderTee: {
    name: "LFF Drop Shoulder Tee — Pre-Order",
    description: "Heavyweight garment-dyed cotton. Oversized drop shoulder fit. Double-sided LFF branding. Pre-order — ships soon.",
    priceId: "price_1TJSwbELc7CqpluZt72mBtdW",
    paymentLinkUrl: "https://buy.stripe.com/cNi3cv9UKe236xm9Jmbwk0a",
  },
  tee3Pack: {
    name: "LFF Tee 3-Pack",
    description: "Three LFF Drop Shoulder Tees — one of each colour (Brown, Black, Cream). Save $15.",
    priceId: "price_1TK7R7ELc7CqpluZYSUNLcWj",
    paymentLinkUrl: "",
  },
  goatPack: {
    name: "THE GOAT PACK",
    description: "Tee + Straps + Cuffs + Socks — the ultimate LFF bundle.",
    priceId: "price_1TJoJJELc7CqpluZsFeM7SfV",
    paymentLinkUrl: "",
  },
  // Downloadable program — The Hypertrophy Meta ($60 AUD one-off, live).
  // Stripe: product prod_UleaFnjTrALzrQ · price price_1Tm7HNELc7CqpluZHgF9i3KB
  // Launch promo: code GROW (50% off once, max 5 redemptions).
  programMeta: {
    name: "The Hypertrophy Meta — Program",
    description: "Self-guided upper/lower hypertrophy program (PDF). One-off, yours forever.",
    priceId: "price_1Tm7HNELc7CqpluZHgF9i3KB",
    paymentLinkUrl: "https://buy.stripe.com/8x29AT4Aq7DF4pe2gUbwk0o",
  },
} as const;

export type ProductKey = keyof typeof STRIPE_PRODUCTS;

/**
 * Payment link id for the program (the Instagram-safe checkout path).
 *
 * Checkout sessions created from a Stripe Payment Link arrive with EMPTY
 * metadata — no `type: "program_order"`. Anything that gates on that metadata
 * must also accept this payment link id, or Instagram buyers pay and then get
 * "This purchase could not be verified" with no delivery email. Exactly the
 * bug that made server/stripe/paymentLinkItems.ts necessary for the shop.
 *
 * Mirrored client-side as PROGRAM_PAYMENT_LINK in client/src/lib/paymentLinks.ts.
 */
export const PROGRAM_PAYMENT_LINK_ID = "plink_1U2mGXELc7CqpluZoNWnZ0PA";

/** True when a checkout session is a program purchase, by either route. */
export function isProgramOrder(session: {
  metadata?: Record<string, string> | null;
  payment_link?: string | { id: string } | null;
}): boolean {
  if (session.metadata?.type === "program_order") return true;
  const link = session.payment_link;
  const linkId = typeof link === "string" ? link : link?.id;
  return linkId === PROGRAM_PAYMENT_LINK_ID;
}
