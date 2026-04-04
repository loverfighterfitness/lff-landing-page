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
} as const;

export type ProductKey = keyof typeof STRIPE_PRODUCTS;
