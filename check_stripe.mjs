import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });

const products = await stripe.products.list({ limit: 20 });
if (!products.data.length) {
  console.log("No products found in this Stripe test account.");
} else {
  for (const p of products.data) {
    console.log(`Product: ${p.id} | ${p.name}`);
    const prices = await stripe.prices.list({ product: p.id });
    for (const pr of prices.data) {
      console.log(`  Price: ${pr.id} | ${pr.unit_amount} ${pr.currency} / ${pr.recurring?.interval ?? "one-time"}`);
    }
  }
}
