/**
 * Stripe Webhook Handler
 * Verifies Stripe signatures and handles checkout.session.completed events
 */
import { Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "../_core/env";
import { notifyOwner } from "../_core/notification";

export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events — return verification response
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Event received: ${event.type} (${event.id})`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const productName = session.metadata?.product_name ?? "Unknown Package";
      const customerEmail = session.customer_details?.email ?? "unknown";
      const customerName = session.customer_details?.name ?? "Unknown";
      const amountPaid = session.amount_total
        ? `$${(session.amount_total / 100).toFixed(2)} AUD`
        : "unknown";

      console.log(
        `[Webhook] Payment completed: ${productName} by ${customerName} (${customerEmail}) — ${amountPaid}`
      );

      // Notify Levi of new client payment
      await notifyOwner({
        title: `💪 New Client Payment — ${productName}`,
        content: `${customerName} (${customerEmail}) just paid ${amountPaid} for ${productName}. Check your Stripe dashboard and reach out within 24 hours.`,
      });

      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}
