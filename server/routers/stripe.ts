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
  // One-off downloadable program (The Hypertrophy Meta). Hosted Stripe Checkout,
  // delivered by emailed signed link via the webhook. allow_promotion_codes lets
  // a "FOUNDERS" code (50% off, max_redemptions: 25) apply the launch price.
  createProgramCheckout: publicProcedure.mutation(async () => {
    const stripe = getStripe();
    const siteUrl = ENV.siteUrl;
    const product = STRIPE_PRODUCTS.programMeta;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: product.priceId, quantity: 1 }],
      success_url: `${siteUrl}/program?checkout=success`,
      cancel_url: `${siteUrl}/program?checkout=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        type: "program_order",
        product_name: product.name,
      },
    });

    return { url: session.url };
  }),

  createShopCheckout: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            priceId: z.string(),
            quantity: z.number().int().min(1),
          })
        ).min(1),
        shipping: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[createShopCheckout] items:", JSON.stringify(input.items), "shipping:", input.shipping);
      const stripe = getStripe();
      const siteUrl = ENV.siteUrl;

      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
        input.items.map((item) => ({
          price: item.priceId,
          quantity: item.quantity,
        }));

      // Add flat-rate $10 shipping as ad-hoc line item
      if (input.shipping) {
        line_items.push({
          price_data: {
            currency: "aud",
            product_data: {
              name: "Aus-Wide Shipping",
              description: "Flat-rate shipping Australia-wide",
            },
            unit_amount: 1000, // $10
          },
          quantity: 1,
        });
      }

      // Build items_json metadata (Stripe metadata values max 500 chars)
      const itemsForMeta = input.items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        priceId: i.priceId,
        quantity: i.quantity,
      }));

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        line_items,
        success_url: `${siteUrl}/shop?checkout=success`,
        cancel_url: `${siteUrl}/shop`,
        phone_number_collection: { enabled: true },
        metadata: {
          type: "shop_order",
          items_json: JSON.stringify(itemsForMeta),
          is_shipping: input.shipping ? "true" : "false",
        },
        ...(input.shipping
          ? {
              shipping_address_collection: {
                allowed_countries: ["AU"],
              },
            }
          : {}),
      };

      const session = await stripe.checkout.sessions.create(sessionParams);
      return { url: session.url };
    }),

  createEmbeddedShopCheckout: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            priceId: z.string(),
            quantity: z.number().int().min(1),
          })
        ).min(1),
        shipping: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      const siteUrl = ENV.siteUrl;

      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
        input.items.map((item) => ({
          price: item.priceId,
          quantity: item.quantity,
        }));

      if (input.shipping) {
        line_items.push({
          price_data: {
            currency: "aud",
            product_data: {
              name: "Aus-Wide Shipping",
              description: "Flat-rate shipping Australia-wide",
            },
            unit_amount: 1000,
          },
          quantity: 1,
        });
      }

      const itemsForMeta = input.items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        priceId: i.priceId,
        quantity: i.quantity,
      }));

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        ui_mode: "embedded",
        mode: "payment",
        line_items,
        return_url: `${siteUrl}/shop?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        phone_number_collection: { enabled: true },
        metadata: {
          type: "shop_order",
          items_json: JSON.stringify(itemsForMeta),
          is_shipping: input.shipping ? "true" : "false",
        },
        ...(input.shipping
          ? { shipping_address_collection: { allowed_countries: ["AU"] } }
          : {}),
      };

      const session = await stripe.checkout.sessions.create(sessionParams);
      return {
        clientSecret: session.client_secret!,
        publishableKey: ENV.stripePublishableKey,
      };
    }),

  createEmbeddedCheckoutSession: publicProcedure
    .input(
      z.object({
        productKey: z.enum(["standardCoaching", "compPrepCoaching"]),
        referralCode: z.string().max(32).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      const product = STRIPE_PRODUCTS[input.productKey as ProductKey];
      const siteUrl = ENV.siteUrl;

      const returnUrl = `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}&package=${input.productKey}${input.referralCode ? `&ref=${input.referralCode}` : ""}`;

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        ui_mode: "embedded",
        mode: "subscription",
        line_items: [{ price: product.priceId, quantity: 1 }],
        payment_method_types: ["card"],
        return_url: returnUrl,
        allow_promotion_codes: !input.referralCode,
        metadata: {
          product_key: input.productKey,
          product_name: product.name,
          referral_code: input.referralCode ?? "",
        },
      };

      if (input.referralCode) {
        sessionParams.discounts = [{ coupon: "LFF_REFERRAL_2WEEKS" }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return {
        clientSecret: session.client_secret!,
        publishableKey: ENV.stripePublishableKey,
      };
    }),

  createCheckoutSession: publicProcedure
    .input(
      z.object({
        productKey: z.enum(["standardCoaching", "compPrepCoaching"]),
        // Referral code — if present, apply the 2-weeks-free coupon
        referralCode: z.string().max(32).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      const product = STRIPE_PRODUCTS[input.productKey as ProductKey];
      const siteUrl = ENV.siteUrl;

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        line_items: [
          {
            price: product.priceId,
            quantity: 1,
          },
        ],
        payment_method_types: ["card"],
        success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}&package=${input.productKey}${input.referralCode ? `&ref=${input.referralCode}` : ""}`,
        cancel_url: `${siteUrl}/#coaching`,
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
