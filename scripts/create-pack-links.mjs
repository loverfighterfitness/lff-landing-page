/**
 * Create dedicated Stripe payment links for THE GOAT PACK ($99) and the
 * Tee 3-Pack, copying the collection settings from the existing tee link.
 * Both currently fall through to the single-tee $45 link on Instagram —
 * undercharging bundle buyers.
 *
 * Run: node --env-file=.env scripts/create-pack-links.mjs
 * Output: prints URLs + writes scripts/pack-links.json
 */
import Stripe from "stripe";
import { writeFileSync } from "fs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Existing single-tee payment link — used as the settings template
const TEE_LINK_ID = "plink_1TJSwcELc7CqpluZzU5yzsK6";

const PACKS = [
  { key: "goat-pack", name: "THE GOAT PACK", priceId: "price_1TJoJJELc7CqpluZsFeM7SfV" },
  { key: "tee-3-pack", name: "LFF Tee 3-Pack", priceId: "price_1TK7R7ELc7CqpluZYSUNLcWj" },
];

const template = await stripe.paymentLinks.retrieve(TEE_LINK_ID);
console.log(`Template (${TEE_LINK_ID}):`);
console.log(`  shipping_address_collection: ${JSON.stringify(template.shipping_address_collection)}`);
console.log(`  billing_address_collection:  ${template.billing_address_collection}`);
console.log(`  phone_number_collection:     ${JSON.stringify(template.phone_number_collection)}`);
console.log("");

const out = {};
for (const pack of PACKS) {
  const price = await stripe.prices.retrieve(pack.priceId);
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: pack.priceId, quantity: 1 }],
    ...(template.shipping_address_collection
      ? { shipping_address_collection: { allowed_countries: template.shipping_address_collection.allowed_countries } }
      : {}),
    billing_address_collection: template.billing_address_collection ?? "auto",
    ...(template.phone_number_collection?.enabled ? { phone_number_collection: { enabled: true } } : {}),
    metadata: { product_key: pack.key },
  });
  out[pack.key] = link.url;
  console.log(`${pack.name}: ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()} → ${link.url}`);
}

writeFileSync(new URL("./pack-links.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("\nSaved to scripts/pack-links.json — tell Claude it's done.");
