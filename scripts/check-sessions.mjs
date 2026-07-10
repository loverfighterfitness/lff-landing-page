/**
 * Diagnostic: dump recent paid checkout sessions with their metadata,
 * payment link, line items, and custom fields — to see what variant
 * data (size/colour) Stripe actually has for shop orders.
 *
 * Run: node --env-file=.env scripts/check-sessions.mjs
 */
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const sessions = await stripe.checkout.sessions.list({ limit: 15 });

for (const s of sessions.data.filter((x) => x.payment_status === "paid")) {
  console.log("────────────────────────────────────────");
  console.log(`session:  ${s.id}`);
  console.log(`date:     ${new Date(s.created * 1000).toISOString().slice(0, 16)}`);
  console.log(`amount:   ${(s.amount_total / 100).toFixed(2)} ${s.currency}`);
  console.log(`plink:    ${s.payment_link ?? "—"}`);
  console.log(`metadata: ${JSON.stringify(s.metadata)}`);
  console.log(`custom_fields: ${JSON.stringify(s.custom_fields)}`);

  const li = await stripe.checkout.sessions.listLineItems(s.id, { limit: 10 });
  for (const item of li.data) {
    console.log(`  item: ${item.description} | qty ${item.quantity} | price ${item.price?.id}`);
  }
}
