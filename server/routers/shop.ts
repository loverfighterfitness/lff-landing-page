/**
 * Shop Router — stock queries, order management, inventory updates
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  shopProducts,
  shopVariants,
  shopOrders,
  shopOrderItems,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

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
