/**
 * Stripe Webhook Handler
 * Verifies Stripe signatures and handles checkout.session.completed events
 */
import { Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "../_core/env";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { sendPushNotification } from "../_core/push";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import {
  shopOrders,
  shopOrderItems,
  shopVariants,
  shopProducts,
  pushSubscriptions,
} from "../../drizzle/schema";

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

      // Check if this is a shop order
      if (session.metadata?.type === "shop_order") {
        await handleShopOrder(stripe, session);
        break;
      }

      // Default: coaching payment notification
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
        title: `New Client Payment — ${productName}`,
        content: `${customerName} (${customerEmail}) just paid ${amountPaid} for ${productName}. Check your Stripe dashboard and reach out within 24 hours.`,
      });

      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

/**
 * Handle a completed shop order:
 * 1. Retrieve line items from Stripe
 * 2. Parse items_json metadata for cart details
 * 3. Insert order + order items
 * 4. Decrement stock
 * 5. Notify Levi
 */
async function handleShopOrder(stripe: Stripe, session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available — cannot process shop order");
    return;
  }

  const customerEmail = session.customer_details?.email ?? "unknown";
  const customerName = session.customer_details?.name ?? "Unknown";
  const shippingInfo = (session as any).shipping_details ?? (session as any).shipping;
  const shippingAddress = shippingInfo?.address
    ? JSON.stringify(shippingInfo.address)
    : null;

  // Parse the items_json metadata
  let cartItems: { id: string; name: string; price: number; priceId: string; quantity: number }[] = [];
  try {
    cartItems = JSON.parse(session.metadata?.items_json ?? "[]");
  } catch (e) {
    console.error("[Webhook] Failed to parse items_json:", e);
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity * 100, 0);
  const isShipping = session.metadata?.is_shipping === "true";
  const shippingCost = isShipping ? 1000 : 0; // $10 flat rate
  const total = session.amount_total ?? subtotal + shippingCost;

  console.log(
    `[Webhook] Shop order: ${customerName} (${customerEmail}) — ${cartItems.length} item(s), $${(total / 100).toFixed(2)}`
  );

  // Check for duplicate (idempotent)
  const existing = await db
    .select({ id: shopOrders.id })
    .from(shopOrders)
    .where(eq(shopOrders.stripeSessionId, session.id))
    .limit(1);

  if (existing.length > 0) {
    console.log(`[Webhook] Shop order ${session.id} already processed — skipping`);
    return;
  }

  // Insert the order
  const [orderResult] = await db.insert(shopOrders).values({
    stripeSessionId: session.id,
    stripePaymentIntent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    customerEmail,
    customerName,
    shippingAddress,
    isShipping,
    shippingCost,
    subtotal,
    total,
    status: "unfulfilled",
  });

  const orderId = orderResult.insertId;

  // Insert order items
  for (const item of cartItems) {
    // Parse variant info from the id (e.g. "tee-brown-L" → "brown / L")
    const variant = parseVariantFromId(item.id);

    await db.insert(shopOrderItems).values({
      orderId,
      productName: item.name,
      variant,
      quantity: item.quantity,
      unitPrice: item.price * 100, // convert dollars to cents
      priceId: item.priceId,
    });

    // Decrement stock for this item
    await decrementStockForItem(db, item.id, item.quantity);
  }

  // Notify Levi
  const itemSummary = cartItems
    .map((i) => `${i.quantity}x ${i.name}`)
    .join(", ");
  const amountStr = `$${(total / 100).toFixed(2)}`;

  await notifyOwner({
    title: `Shop Order — ${amountStr}`,
    content: `${customerName} (${customerEmail}) ordered: ${itemSummary}. ${isShipping ? "Shipping required." : "Pickup."} Total: ${amountStr}`,
  });

  // Email notification
  sendEmail({
    to: ENV.gmailUser,
    subject: `New LFF Shop Order — ${amountStr}`,
    html: `
      <h2>New Shop Order</h2>
      <p><strong>${customerName}</strong> (${customerEmail})</p>
      <p><strong>Items:</strong> ${itemSummary}</p>
      <p><strong>Total:</strong> ${amountStr}</p>
      <p><strong>Delivery:</strong> ${isShipping ? "Shipping" : "Pickup"}</p>
      ${shippingAddress ? `<p><strong>Address:</strong> ${shippingAddress}</p>` : ""}
      <p>Check <a href="https://dashboard.stripe.com">Stripe</a> for full details.</p>
    `,
  }).catch((e) => console.warn("[Email] Shop order notification failed:", e));

  // Push notification to all subscribed devices
  (async () => {
    try {
      const subs = await db.select().from(pushSubscriptions);
      for (const sub of subs) {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          {
            title: `Shop Order — ${amountStr}`,
            body: `${customerName}: ${itemSummary}`,
            url: "/admin/leads",
          }
        );
        if (result.error === "subscription_expired") {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
      }
    } catch (e) {
      console.warn("[Push] Shop order notification failed:", e);
    }
  })();
}

/**
 * Parse a human-readable variant string from a cart item id.
 * e.g. "tee-brown-L" → "brown / L"
 * e.g. "socks-cream" → "cream"
 * e.g. "lifting-straps" → null
 * e.g. "goat-pack" → null
 * e.g. "tee-3-pack-L-M-XL" → "L / M / XL"
 */
function parseVariantFromId(id: string): string | null {
  // Tee with colour and size: "tee-brown-L", "tee-cream-2XL"
  const teeMatch = id.match(/^tee-(brown|cream|black)-(\w+)$/);
  if (teeMatch) return `${teeMatch[1]} / ${teeMatch[2]}`;

  // Socks with colour: "socks-cream", "socks-brown"
  const socksMatch = id.match(/^socks-(cream|brown)$/);
  if (socksMatch) return socksMatch[1];

  // 3-pack with sizes: "tee-3-pack-L-M-XL"
  if (id.startsWith("tee-3-pack-")) {
    const sizes = id.replace("tee-3-pack-", "").split("-");
    return sizes.join(" / ");
  }

  // Everything else (straps, cuffs, goat-pack) — no variant
  return null;
}

/**
 * Decrement stock in shopVariants for a purchased item.
 * Handles both direct products and bundles.
 */
async function decrementStockForItem(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  itemId: string,
  quantity: number
) {
  // Handle GOAT pack bundle
  if (itemId === "goat-pack") {
    // Brown socks
    await decrementVariantStock(db, "socks-brown", "brown", undefined, quantity);
    // Wrist cuffs
    await decrementVariantStock(db, "wrist-cuffs", undefined, undefined, quantity);
    // Lifting straps
    await decrementVariantStock(db, "lifting-straps", undefined, undefined, quantity);
    // Brown tee in L (default for GOAT pack)
    await decrementVariantStock(db, "drop-shoulder-tee", "brown", "L", quantity);
    return;
  }

  // Handle 3-pack bundle: "tee-3-pack-L-M-XL" (brown/cream/black in those sizes)
  if (itemId.startsWith("tee-3-pack-")) {
    const sizes = itemId.replace("tee-3-pack-", "").split("-");
    const colours = ["brown", "cream", "black"];
    for (let i = 0; i < Math.min(sizes.length, colours.length); i++) {
      await decrementVariantStock(db, "drop-shoulder-tee", colours[i], sizes[i], quantity);
    }
    return;
  }

  // Handle tee: "tee-brown-L"
  const teeMatch = itemId.match(/^tee-(brown|cream|black)-(\w+)$/);
  if (teeMatch) {
    await decrementVariantStock(db, "drop-shoulder-tee", teeMatch[1], teeMatch[2], quantity);
    return;
  }

  // Handle socks: "socks-cream", "socks-brown"
  const socksMatch = itemId.match(/^socks-(cream|brown)$/);
  if (socksMatch) {
    await decrementVariantStock(db, `socks-${socksMatch[1]}`, socksMatch[1], undefined, quantity);
    return;
  }

  // Handle lifting-straps
  if (itemId === "lifting-straps") {
    await decrementVariantStock(db, "lifting-straps", undefined, undefined, quantity);
    return;
  }

  // Handle cuffs
  if (itemId === "cuffs") {
    await decrementVariantStock(db, "wrist-cuffs", undefined, undefined, quantity);
    return;
  }

  console.warn(`[Webhook] Unknown item id for stock decrement: ${itemId}`);
}

/**
 * Decrement stock for a specific product variant by slug, colour, size.
 */
async function decrementVariantStock(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  productSlug: string,
  colour: string | undefined,
  size: string | undefined,
  quantity: number
) {
  try {
    // Find the product
    const products = await db
      .select({ id: shopProducts.id })
      .from(shopProducts)
      .where(eq(shopProducts.slug, productSlug))
      .limit(1);

    if (products.length === 0) {
      console.warn(`[Stock] Product not found: ${productSlug}`);
      return;
    }

    const productId = products[0].id;

    // Find matching variant
    const allVariants = await db
      .select()
      .from(shopVariants)
      .where(eq(shopVariants.productId, productId));

    const variant = allVariants.find((v) => {
      if (colour && v.colour !== colour) return false;
      if (size && v.size !== size) return false;
      if (!colour && v.colour) return false;
      if (!size && v.size) return false;
      return true;
    });

    if (!variant) {
      console.warn(`[Stock] Variant not found: ${productSlug} colour=${colour} size=${size}`);
      return;
    }

    const newStock = Math.max(0, variant.stock - quantity);
    await db
      .update(shopVariants)
      .set({ stock: newStock })
      .where(eq(shopVariants.id, variant.id));

    console.log(
      `[Stock] ${productSlug} ${colour ?? ""} ${size ?? ""}: ${variant.stock} → ${newStock}`
    );
  } catch (e) {
    console.error(`[Stock] Failed to decrement: ${productSlug}`, e);
  }
}
