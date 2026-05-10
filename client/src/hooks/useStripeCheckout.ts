/**
 * useStripeCheckout
 * Redirects to Stripe payment links for checkout.
 * When a referral code is present, appends the 2-weeks-free promo code
 * directly to the payment link URL — no server session required.
 */
import { useState } from "react";

export type ProductKey =
  | "standardCoaching"
  | "compPrepCoaching"
  | "socksCream"
  | "socksBrown"
  | "liftingStraps"
  | "cuffs";

const PAYMENT_LINKS: Record<ProductKey, string> = {
  standardCoaching: "https://buy.stripe.com/3cI00j4Aq0bdf3S08Mbwk04",
  compPrepCoaching: "https://buy.stripe.com/3cI9AT9UK7DFaNC1cQbwk05",
  socksCream: "https://buy.stripe.com/cNi8wPaYO4rtdZO1cQbwk06",
  socksBrown: "https://buy.stripe.com/dRm8wP7MC0bd08Y1cQbwk07",
  liftingStraps: "https://buy.stripe.com/dRm8wP8QG9LN1d23kYbwk08",
  cuffs: "https://buy.stripe.com/7sY4gz4Aq7DF8Fu1cQbwk09",
};

// The coupon ID on the live Stripe account for referral 2-weeks-free discount
const REFERRAL_PROMO_CODE = "LFF2WEEKSFREE";

export function useStripeCheckout() {
  const [loading, setLoading] = useState<ProductKey | null>(null);

  const checkout = (productKey: ProductKey) => {
    setLoading(productKey);

    let url = PAYMENT_LINKS[productKey];

    // If the user arrived via a referral link, pre-fill the promo code
    const referralCode = sessionStorage.getItem("lff_referral_code");
    if (referralCode) {
      url += `?prefilled_promo_code=${REFERRAL_PROMO_CODE}`;
    }

    window.location.href = url;

    // Reset loading after a short delay (navigation may take a moment)
    setTimeout(() => setLoading(null), 3000);
  };

  return { checkout, loading };
}
