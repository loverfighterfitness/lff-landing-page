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
 * Handle a completed shop order. Resilient to database outages —
 * notifications fire even when the DB is unavailable, so Levi never
 * misses an order alert. DB writes are best-effort and can be backfilled
 * via the admin "Backfill" button later.
 *
 * Order of operations:
 * 1. Extract everything from the Stripe session (no DB needed)
 * 2. Try to connect to DB (non-fatal if it fails)
 * 3. Idempotency check (only if DB is up — otherwise skip and rely on Stripe single-delivery)
 * 4. Send email notification immediately (doesn't need DB)
 * 5. Best-effort: insert order + decrement stock (skipped if DB down)
 * 6. Best-effort: send push notifications to subscribed devices (needs DB for subs)
 */
async function handleShopOrder(stripe: Stripe, session: Stripe.Checkout.Session) {
  // ── 1. Extract everything from Stripe session (no DB dependency) ──
  const customerEmail = session.customer_details?.email ?? "unknown";
  const customerName = session.customer_details?.name ?? "Unknown";
  const customerPhone = session.customer_details?.phone ?? null;
  const shippingInfo = (session as any).shipping_details ?? (session as any).shipping;
  const shippingAddressObj: Stripe.Address | null = shippingInfo?.address ?? null;
  const shippingAddress = shippingAddressObj
    ? JSON.stringify(shippingAddressObj)
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

  // ── 2. Try to connect to DB (non-fatal) ──
  let db: Awaited<ReturnType<typeof getDb>> = null;
  try {
    db = await getDb();
  } catch (err) {
    console.error("[Webhook] getDb threw:", err);
  }
  if (!db) {
    console.warn("[Webhook] Database unavailable — sending notifications anyway, order will need manual backfill");
  }

  // ── 3. Idempotency check (only if DB is reachable) ──
  if (db) {
    try {
      const existing = await db
        .select({ id: shopOrders.id })
        .from(shopOrders)
        .where(eq(shopOrders.stripeSessionId, session.id))
        .limit(1);

      if (existing.length > 0) {
        console.log(`[Webhook] Shop order ${session.id} already processed — skipping`);
        return;
      }
    } catch (err) {
      console.warn("[Webhook] Idempotency check failed (continuing anyway):", err);
    }
  }

  // ── 5a. Best-effort DB writes (BEFORE notifications, so backfill warning is accurate) ──
  let dbWriteFailed = false;
  if (db) {
    try {
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

      for (const item of cartItems) {
        const variant = parseVariantFromId(item.id);
        await db.insert(shopOrderItems).values({
          orderId,
          productName: item.name,
          variant,
          quantity: item.quantity,
          unitPrice: item.price * 100,
          priceId: item.priceId,
        });
        await decrementStockForItem(db, item.id, item.quantity);
      }
    } catch (err) {
      dbWriteFailed = true;
      console.error("[Webhook] DB writes failed (notifications still firing):", err);
    }
  } else {
    dbWriteFailed = true;
  }

  // ── 4 + 5b. Build & send notifications (always — never blocked by DB) ──
  const itemSummary = cartItems
    .map((i) => `${i.quantity}x ${i.name}`)
    .join(", ");
  const amountStr = `$${(total / 100).toFixed(2)} AUD`;
  const subtotalStr = `$${(subtotal / 100).toFixed(2)}`;
  const shippingStr = isShipping ? `$${(shippingCost / 100).toFixed(2)}` : "—";

  // Build a short subject line: "LFF Order · 2 items · Brown Tee L · Sarah M"
  const firstItemShort = cartItems[0]?.name?.split("—")[0]?.trim() ?? "Order";
  const firstVariant = cartItems[0] ? parseVariantFromId(cartItems[0].id) : null;
  const baseSubject =
    cartItems.length === 1 && cartItems[0].quantity === 1
      ? `LFF Order · ${firstItemShort}${firstVariant ? ` ${firstVariant}` : ""} · ${customerName}`
      : `LFF Order · ${cartItems.reduce((n, i) => n + i.quantity, 0)} items · ${customerName} · ${amountStr}`;
  const subjectLine = dbWriteFailed ? `[DB OFFLINE — backfill] ${baseSubject}` : baseSubject;

  await notifyOwner({
    title: `Shop Order — ${amountStr}`,
    content: `${customerName} (${customerEmail})${customerPhone ? ` · ${customerPhone}` : ""} ordered: ${itemSummary}. ${isShipping ? "Shipping required." : "Pickup."} Total: ${amountStr}`,
  });

  // Email notification — branded, fulfillment-ready pack slip
  const addressHtml = shippingAddressObj
    ? formatAddressHtml(shippingAddressObj, customerName)
    : "";
  const itemsTableHtml = cartItems
    .map((i) => {
      const variant = parseVariantFromId(i.id);
      const lineTotal = `$${((i.price * i.quantity * 100) / 100).toFixed(2)}`;
      return `
        <tr>
          <td style="padding:10px 0;border-top:1px solid rgba(234,230,210,0.14);color:#EAE6D2;font-size:14px;font-weight:600;">
            ${escapeHtml(i.name)}
            ${variant ? `<div style="color:rgba(234,230,210,0.55);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin-top:3px;">${escapeHtml(variant)}</div>` : ""}
          </td>
          <td style="padding:10px 0;border-top:1px solid rgba(234,230,210,0.14);color:rgba(234,230,210,0.85);font-size:14px;text-align:center;font-variant-numeric:tabular-nums;">× ${i.quantity}</td>
          <td style="padding:10px 0;border-top:1px solid rgba(234,230,210,0.14);color:#EAE6D2;font-size:14px;text-align:right;font-variant-numeric:tabular-nums;">${lineTotal}</td>
        </tr>`;
    })
    .join("");

  const stripeSessionLink = `https://dashboard.stripe.com/payments/${session.payment_intent ?? session.id}`;

  const dbWarningBanner = dbWriteFailed
    ? `<div style="padding:14px 28px;background:#3a1a14;border-bottom:1px solid rgba(234,230,210,0.1);">
          <p style="color:#ff8a4c;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px;">⚠ Database offline</p>
          <p style="color:rgba(234,230,210,0.75);font-size:12px;margin:0;line-height:1.5;">This order didn't save to the admin dashboard. Use the <strong>Backfill</strong> button after the DB is back online to import it from Stripe.</p>
        </div>`
    : "";

  const emailHtml = `
    <div style="background:#1a1612;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#221c16;border:1px solid rgba(234,230,210,0.12);border-radius:12px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid rgba(234,230,210,0.1);">
          <p style="color:rgba(234,230,210,0.45);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 6px;font-weight:600;">Lover Fighter Fitness</p>
          <h1 style="color:#EAE6D2;font-size:22px;letter-spacing:0.03em;margin:0;font-weight:700;">New shop order — ${amountStr}</h1>
          <p style="color:rgba(234,230,210,0.55);font-size:12px;margin:8px 0 0;">${isShipping ? "Ship Aus-wide" : "Local pickup"} · Order #${session.id.slice(-10)}</p>
        </div>
        ${dbWarningBanner}

        <div style="padding:22px 28px;border-bottom:1px solid rgba(234,230,210,0.1);">
          <p style="color:rgba(234,230,210,0.45);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 10px;font-weight:600;">Customer</p>
          <p style="color:#EAE6D2;font-size:16px;margin:0 0 4px;font-weight:600;">${escapeHtml(customerName)}</p>
          <p style="color:rgba(234,230,210,0.75);font-size:13px;margin:0;">
            <a href="mailto:${escapeHtml(customerEmail)}" style="color:rgba(234,230,210,0.75);text-decoration:none;">${escapeHtml(customerEmail)}</a>
            ${customerPhone ? ` · <a href="tel:${escapeHtml(customerPhone)}" style="color:rgba(234,230,210,0.75);text-decoration:none;">${escapeHtml(customerPhone)}</a>` : ""}
          </p>
        </div>

        <div style="padding:22px 28px;border-bottom:1px solid rgba(234,230,210,0.1);">
          <p style="color:rgba(234,230,210,0.45);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 10px;font-weight:600;">Pack list</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${itemsTableHtml}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:14px;">
            <tr>
              <td style="color:rgba(234,230,210,0.55);font-size:12px;padding:4px 0;">Subtotal</td>
              <td style="color:rgba(234,230,210,0.85);font-size:12px;text-align:right;font-variant-numeric:tabular-nums;padding:4px 0;">${subtotalStr}</td>
            </tr>
            <tr>
              <td style="color:rgba(234,230,210,0.55);font-size:12px;padding:4px 0;">Shipping</td>
              <td style="color:rgba(234,230,210,0.85);font-size:12px;text-align:right;font-variant-numeric:tabular-nums;padding:4px 0;">${shippingStr}</td>
            </tr>
            <tr>
              <td style="color:#EAE6D2;font-size:14px;font-weight:700;padding:8px 0 0;border-top:1px solid rgba(234,230,210,0.14);">Total</td>
              <td style="color:#EAE6D2;font-size:14px;font-weight:700;text-align:right;font-variant-numeric:tabular-nums;padding:8px 0 0;border-top:1px solid rgba(234,230,210,0.14);">${amountStr}</td>
            </tr>
          </table>
        </div>

        ${addressHtml ? `
        <div style="padding:22px 28px;border-bottom:1px solid rgba(234,230,210,0.1);">
          <p style="color:rgba(234,230,210,0.45);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 10px;font-weight:600;">Ship to</p>
          ${addressHtml}
        </div>` : ""}

        <div style="padding:22px 28px;text-align:center;">
          <a href="${stripeSessionLink}" style="display:inline-block;background:rgba(234,230,210,0.95);color:#54412F;padding:12px 24px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">Open in Stripe</a>
        </div>
      </div>
      <p style="text-align:center;color:rgba(234,230,210,0.35);font-size:10px;letter-spacing:0.15em;text-transform:uppercase;margin:16px 0 0;">Lover Fighter Fitness · Mount Barker, SA</p>
    </div>
  `;

  sendEmail({
    to: ENV.gmailUser,
    subject: subjectLine,
    html: emailHtml,
  }).catch((e) => console.warn("[Email] Shop order notification failed:", e));

  // Push notification to all subscribed devices (skips silently if DB unavailable)
  if (db) {
    const dbForPush = db;
    (async () => {
      try {
        const subs = await dbForPush.select().from(pushSubscriptions);
        const pushBody = cartItems
          .map((i) => {
            const variant = parseVariantFromId(i.id);
            return `${i.quantity}× ${i.name}${variant ? ` (${variant})` : ""}`;
          })
          .join(" · ");
        for (const sub of subs) {
          const result = await sendPushNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            {
              title: `LFF Order · ${amountStr} · ${customerName}`,
              body: `${pushBody}${isShipping ? " · Shipping" : " · Pickup"}`,
              url: "/admin/leads",
            }
          );
          if (result.error === "subscription_expired") {
            await dbForPush.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
          }
        }
      } catch (e) {
        console.warn("[Push] Shop order notification failed:", e);
      }
    })();
  } else {
    console.warn("[Push] Skipped — DB unavailable, can't load subscription list");
  }
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

/**
 * Format a Stripe address object as readable HTML address block.
 */
function formatAddressHtml(addr: Stripe.Address, name: string | null): string {
  const lines = [
    name,
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.postal_code].filter(Boolean).join(" "),
    addr.country,
  ].filter((l): l is string => Boolean(l && l.trim().length));

  return `
    <div style="color:#EAE6D2;font-size:13px;line-height:1.55;">
      ${lines.map((l) => escapeHtml(l)).join("<br/>")}
    </div>
  `;
}

/**
 * Minimal HTML escape for user-provided strings in email templates.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
