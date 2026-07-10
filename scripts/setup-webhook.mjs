/**
 * Fix: the production webhook endpoint was auto-disabled by Stripe after
 * repeated delivery failures, so orders stopped flowing into the tracker
 * live (manual backfill was the only path).
 *
 * This script deletes the dead endpoint and creates a fresh one, then
 * prints the exact Railway command to set the new signing secret.
 *
 * Run: node --env-file=.env scripts/setup-webhook.mjs
 */
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const WEBHOOK_URL = "https://www.loverfighterfitness.com/api/stripe/webhook";

// Remove old endpoints for this URL (disabled or not — we're replacing them)
const existing = await stripe.webhookEndpoints.list({ limit: 20 });
for (const ep of existing.data) {
  if (ep.url === WEBHOOK_URL) {
    await stripe.webhookEndpoints.del(ep.id);
    console.log(`Deleted old endpoint ${ep.id} (status was: ${ep.status})`);
  }
}

// Create the replacement
const endpoint = await stripe.webhookEndpoints.create({
  url: WEBHOOK_URL,
  enabled_events: [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ],
  description: "LFF landing page — shop orders + program delivery + coaching notifications",
});

console.log(`\nCreated new endpoint: ${endpoint.id} (status: ${endpoint.status})`);
console.log("\nNow run this to update Railway (it will auto-redeploy):\n");
console.log(`railway variables --set "STRIPE_WEBHOOK_SECRET=${endpoint.secret}"`);
