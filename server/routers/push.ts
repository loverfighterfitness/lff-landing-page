import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const pushRouter = router({
  /**
   * Public mutation — save a push subscription from the browser
   */
  subscribe: publicProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        keys: z.string(), // JSON string of {p256dh, auth}
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      // Upsert: if endpoint already exists, update keys; otherwise insert
      const existing = await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(pushSubscriptions)
          .set({ keys: input.keys, userAgent: input.userAgent })
          .where(eq(pushSubscriptions.endpoint, input.endpoint));
      } else {
        await db.insert(pushSubscriptions).values({
          endpoint: input.endpoint,
          keys: input.keys,
          userAgent: input.userAgent,
        });
      }

      return { success: true };
    }),

  /**
   * Public mutation — remove a push subscription (when user denies permission)
   */
  unsubscribe: publicProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint));
      return { success: true };
    }),
});
