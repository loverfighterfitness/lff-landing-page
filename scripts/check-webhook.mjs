/**
 * Diagnostic: inspect Stripe webhook endpoint config + recent event delivery.
 * Run: node --env-file=.env scripts/check-webhook.mjs
 */
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log("── Webhook endpoints ──");
const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
if (endpoints.data.length === 0) {
  console.log("NONE CONFIGURED — that's the problem.");
}
for (const ep of endpoints.data) {
  console.log(`url:      ${ep.url}`);
  console.log(`status:   ${ep.status}`);
  console.log(`api ver:  ${ep.api_version ?? "(account default)"}`);
  console.log(`events:   ${ep.enabled_events.join(", ")}`);
  console.log("");
}

console.log("── Recent checkout.session.completed events ──");
const events = await stripe.events.list({ type: "checkout.session.completed", limit: 5 });
for (const ev of events.data) {
  console.log(
    `${new Date(ev.created * 1000).toISOString().slice(0, 16)}  ${ev.id}  pending_webhooks: ${ev.pending_webhooks}`
  );
}
if (events.data.length === 0) console.log("(none in the last 30 days)");
