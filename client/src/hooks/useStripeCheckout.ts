import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { resolvePaymentLink } from "@/lib/paymentLinks";

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
    // Shop products use payment links (one-time purchases).
    // Map hook product keys to cart-style item ids, then resolve through
    // the single source of truth in lib/paymentLinks.ts.
    const ITEM_IDS: Partial<Record<ProductKey, string>> = {
      socksCream: "socks-cream",
      socksBrown: "socks-brown",
      liftingStraps: "lifting-straps",
      cuffs: "cuffs",
    };
    const itemId = ITEM_IDS[productKey];
    if (itemId) {
      const link = resolvePaymentLink(itemId);
      if (link) {
        window.location.href = link;
        return;
      }
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

  return { checkout, loading };
}
