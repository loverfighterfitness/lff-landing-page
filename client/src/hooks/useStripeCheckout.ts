import { useState } from "react";
import { trpc } from "@/lib/trpc";

export type ProductKey =
  | "standardCoaching"
  | "compPrepCoaching"
  | "socksCream"
  | "socksBrown"
  | "liftingStraps"
  | "cuffs";

export function useStripeCheckout() {
  const [loading, setLoading] = useState<ProductKey | null>(null);

  const createSession = trpc.stripe.createCheckoutSession.useMutation();

  const checkout = async (productKey: ProductKey) => {
    // Shop products use payment links (one-time purchases)
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

    // Coaching packages — redirect to Stripe hosted checkout
    setLoading(productKey);
    try {
      const referralCode = sessionStorage.getItem("lff_referral_code") ?? undefined;
      const result = await createSession.mutateAsync({
        productKey: productKey as "standardCoaching" | "compPrepCoaching",
        referralCode,
      });
      if (result.url) window.location.href = result.url;
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(null);
    }
  };

  return { checkout, loading, embeddedSession: null, closeEmbedded: () => {} };
}
