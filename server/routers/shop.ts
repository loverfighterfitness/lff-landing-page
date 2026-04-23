/**
 * Shop Router — stock queries, order management, inventory updates
 */
import { z } from "zod";
import Stripe from "stripe";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import {
  shopProducts,
  shopVariants,
  shopOrders,
  shopOrderItems,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Parse a human-readable variant string from a cart item id.
 * Mirrors the logic in stripe/webhook.ts.
 */
function parseVariantFromId(id: string): string | null {
  const teeMatch = id.match(/^tee-(brown|cream|black)-(\w+)$/);
  if (teeMatch) return `${teeMatch[1]} / ${teeMatch[2]}`;
  const socksMatch = id.match(/^socks-(cream|brown)$/);
  if (socksMatch) return socksMatch[1];
  if (id.startsWith("tee-3-pack-")) {
    const sizes = id.replace("tee-3-pack-", "").split("-");
    return sizes.join(" / ");
  }
  return null;
}

export const shopRouter = router({
  /**
   * getStock — public query returning all active products with their variants + stock counts.
   */
  getStock: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const products = await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.active, true));

    const variants = await db.select().from(shopVariants);

    // Group variants by productId
    const variantsByProduct = new Map<number, typeof variants>();
    for (const v of variants) {
      const existing = variantsByProduct.get(v.productId) ?? [];
      existing.push(v);
      variantsByProduct.set(v.productId, existing);
    }

    return products.map((p) => ({
      ...p,
      variants: variantsByProduct.get(p.id) ?? [],
    }));
  }),

  /**
   * getOrders — protected query returning orders with items, newest first.
   * Optional status filter.
   */
  getOrders: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["unfulfilled", "shipped", "delivered"])
            .optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orders = input?.status
        ? await db
            .select()
            .from(shopOrders)
            .where(eq(shopOrders.status, input.status))
            .orderBy(desc(shopOrders.createdAt))
            .limit(200)
        : await db
            .select()
            .from(shopOrders)
            .orderBy(desc(shopOrders.createdAt))
            .limit(200);

      // Fetch all order items for these orders
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length === 0) return [];

      const allItems = await db.select().from(shopOrderItems);
      const itemsByOrder = new Map<number, (typeof allItems)[number][]>();
      for (const item of allItems) {
        if (orderIds.includes(item.orderId)) {
          const existing = itemsByOrder.get(item.orderId) ?? [];
          existing.push(item);
          itemsByOrder.set(item.orderId, existing);
        }
      }

      return orders.map((o) => ({
        ...o,
        items: itemsByOrder.get(o.id) ?? [],
      }));
    }),

  /**
   * updateOrderStatus — change order fulfilment status.
   */
  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["unfulfilled", "shipped", "delivered"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(shopOrders)
        .set({ status: input.status })
        .where(eq(shopOrders.id, input.id));

      return { success: true };
    }),

  /**
   * backfillFromStripe — pull all past Stripe checkout sessions that were
   * shop orders and insert any that are missing from the shop_orders table.
   * Uses `items_json` metadata to reconstruct variant info.
   * Safe to re-run — it deduplicates on stripeSessionId.
   */
  backfillFromStripe: protectedProcedure
    .input(
      z
        .object({
          sinceDays: z.number().int().min(1).max(365).optional(),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const stripe = new Stripe(ENV.stripeSecretKey, {
        apiVersion: "2026-02-25.clover",
      });

      const sinceDays = input?.sinceDays ?? 90;
      const sinceUnix = Math.floor(Date.now() / 1000) - sinceDays * 86400;

      // List all completed checkout sessions from the last N days
      const allSessions: Stripe.Checkout.Session[] = [];
      let startingAfter: string | undefined = undefined;
      let pages = 0;
      while (pages < 10) {
        const resp: Stripe.ApiList<Stripe.Checkout.Session> = await stripe.checkout.sessions.list({
          limit: 100,
          created: { gte: sinceUnix },
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });
        allSessions.push(...resp.data);
        if (!resp.has_more) break;
        startingAfter = resp.data[resp.data.length - 1]?.id;
        pages++;
      }

      // Filter to shop orders only, paid
      const shopSessions = allSessions.filter(
        (s) =>
          s.metadata?.type === "shop_order" &&
          s.payment_status === "paid"
      );

      // Fetch existing session IDs from DB
      const existing = await db
        .select({ stripeSessionId: shopOrders.stripeSessionId })
        .from(shopOrders);
      const existingIds = new Set(existing.map((e) => e.stripeSessionId));

      const missing = shopSessions.filter((s) => !existingIds.has(s.id));

      let inserted = 0;
      let skippedNoMetadata = 0;
      const detail: { sessionId: string; customer: string; items: number }[] = [];

      for (const session of missing) {
        const customerEmail = session.customer_details?.email ?? "unknown";
        const customerName = session.customer_details?.name ?? "Unknown";
        const shippingInfo = (session as any).shipping_details ?? (session as any).shipping;
        const shippingAddressObj: Stripe.Address | null = shippingInfo?.address ?? null;
        const shippingAddress = shippingAddressObj ? JSON.stringify(shippingAddressObj) : null;

        let cartItems: {
          id: string;
          name: string;
          price: number;
          priceId: string;
          quantity: number;
        }[] = [];
        try {
          cartItems = JSON.parse(session.metadata?.items_json ?? "[]");
        } catch {
          skippedNoMetadata++;
          continue;
        }
        if (cartItems.length === 0) {
          skippedNoMetadata++;
          continue;
        }

        const subtotal = cartItems.reduce(
          (sum, it) => sum + it.price * it.quantity * 100,
          0
        );
        const isShipping = session.metadata?.is_shipping === "true";
        const shippingCost = isShipping ? 1000 : 0;
        const total = session.amount_total ?? subtotal + shippingCost;

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
          createdAt: new Date(session.created * 1000),
        });

        const orderId = orderResult.insertId;

        for (const item of cartItems) {
          await db.insert(shopOrderItems).values({
            orderId,
            productName: item.name,
            variant: parseVariantFromId(item.id),
            quantity: item.quantity,
            unitPrice: item.price * 100,
            priceId: item.priceId,
          });
        }

        inserted++;
        detail.push({ sessionId: session.id, customer: customerName, items: cartItems.length });
      }

      return {
        scanned: shopSessions.length,
        alreadyPresent: shopSessions.length - missing.length,
        inserted,
        skippedNoMetadata,
        detail,
      };
    }),

  /**
   * updateStock — manually set stock for a variant.
   */
  updateStock: protectedProcedure
    .input(
      z.object({
        variantId: z.number(),
        stock: z.number().int().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(shopVariants)
        .set({ stock: input.stock })
        .where(eq(shopVariants.id, input.variantId));

      return { success: true };
    }),
});
