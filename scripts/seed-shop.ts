/**
 * Seed script: populates shop_products and shop_variants with initial LFF merch inventory.
 * Idempotent — skips products whose slug already exists.
 *
 * Run with: npx tsx scripts/seed-shop.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { shopProducts, shopVariants } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

interface ProductSeed {
  name: string;
  slug: string;
  price: number; // cents
  priceId: string;
  category: "socks" | "straps" | "cuffs" | "tee" | "bundle";
  variants: { colour?: string; size?: string; stock: number }[];
}

const PRODUCTS: ProductSeed[] = [
  {
    name: "LFF Crew Socks — Cream",
    slug: "socks-cream",
    price: 1000,
    priceId: "price_1TJP0dELc7CqpluZ2XgJcnke",
    category: "socks",
    variants: [{ colour: "cream", stock: 30 }],
  },
  {
    name: "LFF Crew Socks — Brown",
    slug: "socks-brown",
    price: 1000,
    priceId: "price_1TJP0eELc7CqpluZeQeIQm3B",
    category: "socks",
    variants: [{ colour: "brown", stock: 30 }],
  },
  {
    name: "Lifting Straps",
    slug: "lifting-straps",
    price: 3500,
    priceId: "price_1TJP0fELc7CqpluZACOnKwEj",
    category: "straps",
    variants: [{ stock: 15 }],
  },
  {
    name: "Wrist Cuffs",
    slug: "wrist-cuffs",
    price: 2500,
    priceId: "price_1TJP0gELc7CqpluZtNGU2oTn",
    category: "cuffs",
    variants: [{ stock: 15 }],
  },
  {
    name: "Drop Shoulder Tee",
    slug: "drop-shoulder-tee",
    price: 4500,
    priceId: "price_1TJSwbELc7CqpluZt72mBtdW",
    category: "tee",
    variants: [
      // Brown
      { colour: "brown", size: "S", stock: 5 },
      { colour: "brown", size: "M", stock: 7 },
      { colour: "brown", size: "L", stock: 12 },
      { colour: "brown", size: "XL", stock: 11 },
      { colour: "brown", size: "2XL", stock: 5 },
      // Cream
      { colour: "cream", size: "S", stock: 2 },
      { colour: "cream", size: "M", stock: 3 },
      { colour: "cream", size: "L", stock: 6 },
      { colour: "cream", size: "XL", stock: 5 },
      { colour: "cream", size: "2XL", stock: 3 },
      // Black
      { colour: "black", size: "S", stock: 3 },
      { colour: "black", size: "M", stock: 3 },
      { colour: "black", size: "L", stock: 6 },
      { colour: "black", size: "XL", stock: 5 },
      { colour: "black", size: "2XL", stock: 3 },
    ],
  },
  {
    name: "Tee 3-Pack",
    slug: "tee-3-pack",
    price: 12000,
    priceId: "price_1TK7R7ELc7CqpluZYSUNLcWj",
    category: "bundle",
    variants: [{ stock: 0 }], // bundles don't track own stock
  },
  {
    name: "THE GOAT PACK",
    slug: "goat-pack",
    price: 9900,
    priceId: "price_1TJoJJELc7CqpluZsFeM7SfV",
    category: "bundle",
    variants: [{ stock: 0 }], // bundles don't track own stock
  },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    // Check if slug already exists
    const existing = await db
      .select({ id: shopProducts.id })
      .from(shopProducts)
      .where(eq(shopProducts.slug, p.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭  Skipping ${p.slug} — already exists`);
      skipped++;
      continue;
    }

    // Insert product
    const [result] = await db.insert(shopProducts).values({
      name: p.name,
      slug: p.slug,
      price: p.price,
      priceId: p.priceId,
      category: p.category,
      active: true,
    });

    const productId = result.insertId;

    // Insert variants
    for (const v of p.variants) {
      await db.insert(shopVariants).values({
        productId,
        colour: v.colour ?? null,
        size: v.size ?? null,
        stock: v.stock,
      });
    }

    console.log(`✅ Created ${p.slug} with ${p.variants.length} variant(s)`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
