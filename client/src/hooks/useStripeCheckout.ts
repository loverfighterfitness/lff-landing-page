/**
 * useStripeCheckout
 * Uses Stripe Embedded Checkout — the full payment form renders in a modal
 * directly on the page. No external redirects, works in every browser
 * including Instagram's in-app browser.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export type ProductKey =
  | "standardCoaching"
  | "compPrepCoaching"
  | "socksCream"
  | "socksBrown"
  | "liftingStraps"
  | "cuffs";

interface EmbeddedSession {
  clientSecret: string;
  publishableKey: string;
}

export function useStripeCheckout() {
  const [loading, setLoading] = useState<ProductKey | null>(null);
  const [embeddedSession, setEmbeddedSession] = useState<EmbeddedSession | null>(null);

  const createEmbeddedSession = trpc.stripe.createEmbeddedCheckoutSession.useMutation();

  const isInstagram = typeof navigator !== "undefined" && /Instagram/.test(navigator.userAgent);

  const checkout = async (productKey: ProductKey) => {
    // Instagram's in-app browser blocks all external Stripe redirects.
    // Send user to Safari where checkout works normally.
    if (isInstagram) {
      window.location.href = "x-safari-https://www.loverfighterfitness.com/#coaching";
      return;
    }

    // Shop products still use payment links (they're one-time, not subscriptions)
    const shopProducts = ["socksCream", "socksBrown", "liftingStraps", "cuffs"];
    if (shopProducts.includes(productKey)) {
      const PAYMENT_LINKS: Record<string, string> = {
        socksCream: "https://buy.stripe.com/cNi8wPaYO4rtdZO1cQbwk06",
        socksBrown: "https://buy.stripe.com/dRm8wP7MC0bd08Y1cQbwk07",
        liftingStraps: "https://buy.stripe.com/dRm8wP8QG9LN1d23kYbwk08",
        cuffs: "https://buy.stripe.com/7sY4gz4Aq7DF8Fu1cQbwk09",
      };
      window.location.href = PAYMENT_LINKS[productKey];
      return;
    }

    // Coaching packages — use embedded checkout
    setLoading(productKey);
    try {
      const referralCode = sessionStorage.getItem("lff_referral_code") ?? undefined;
      const result = await createEmbeddedSession.mutateAsync({
        productKey: productKey as "standardCoaching" | "compPrepCoaching",
        referralCode,
      });
      setEmbeddedSession({ clientSecret: result.clientSecret, publishableKey: result.publishableKey });
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(null);
    }
  };

  const closeEmbedded = () => setEmbeddedSession(null);

  return { checkout, loading, embeddedSession, closeEmbedded };
}
