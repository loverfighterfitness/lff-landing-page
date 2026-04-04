/**
 * Stripe Checkout Router
 * Creates Stripe Checkout sessions for LFF coaching packages
 */
import Stripe from "stripe";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { STRIPE_PRODUCTS, type ProductKey } from "../stripe/products";
import { notifyOwner } from "../_core/notification";

function getStripe() {
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}

export const stripeRouter = router({
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        productKey: z.enum(["standardCoaching", "compPrepCoaching"]),
        origin: z.string().url(),
        // Referral code — if present, apply the 2-weeks-free coupon
        referralCode: z.string().max(32).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      const product = STRIPE_PRODUCTS[input.productKey as ProductKey];

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        line_items: [
          {
            price: product.priceId,
            quantity: 1,
          },
        ],
        payment_method_types: ["card"],
        success_url: `${input.origin}/success?session_id={CHECKOUT_SESSION_ID}&package=${input.productKey}${input.referralCode ? `&ref=${input.referralCode}` : ""}`,
        cancel_url: `${input.origin}/#coaching`,
        allow_promotion_codes: !input.referralCode, // disable manual promo codes when referral coupon is applied
        metadata: {
          product_key: input.productKey,
          product_name: product.name,
          referral_code: input.referralCode ?? "",
        },
      };

      // Apply the referral coupon (2 weeks free) if a valid referral code was used
      if (input.referralCode) {
        sessionParams.discounts = [{ coupon: "LFF_REFERRAL_2WEEKS" }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return { url: session.url };
    }),
});
