import { relations } from "drizzle-orm";
import { shopProducts, shopVariants, shopOrders, shopOrderItems } from "./schema";

export const shopProductsRelations = relations(shopProducts, ({ many }) => ({
  variants: many(shopVariants),
}));

export const shopVariantsRelations = relations(shopVariants, ({ one }) => ({
  product: one(shopProducts, {
    fields: [shopVariants.productId],
    references: [shopProducts.id],
  }),
}));

export const shopOrdersRelations = relations(shopOrders, ({ many }) => ({
  items: many(shopOrderItems),
}));

export const shopOrderItemsRelations = relations(shopOrderItems, ({ one }) => ({
  order: one(shopOrders, {
    fields: [shopOrderItems.orderId],
    references: [shopOrders.id],
  }),
}));
