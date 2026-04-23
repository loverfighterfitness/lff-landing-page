import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendPushNotification } from "../_core/push";

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

  /**
   * Public query — check whether a given endpoint is currently subscribed.
   * Also returns the total count of subscribed devices.
   */
  status: publicProcedure
    .input(z.object({ endpoint: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { isSubscribed: false, totalDevices: 0 };

      const all = await db
        .select({ endpoint: pushSubscriptions.endpoint })
        .from(pushSubscriptions);

      const isSubscribed = input.endpoint
        ? all.some((s) => s.endpoint === input.endpoint)
        : false;

      return { isSubscribed, totalDevices: all.length };
    }),

  /**
   * Public mutation — fire a test push notification.
   * If an endpoint is provided, sends to that specific device.
   * Otherwise, sends to ALL subscribed devices (so you can check your phone
   * even if you triggered it from your laptop).
   */
  sendTest: publicProcedure
    .input(z.object({ endpoint: z.string().optional(), allDevices: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { sent: 0, failed: 0, expired: 0 };

      let subs: { endpoint: string; keys: string }[];
      if (input.endpoint && !input.allDevices) {
        subs = await db
          .select({ endpoint: pushSubscriptions.endpoint, keys: pushSubscriptions.keys })
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, input.endpoint))
          .limit(1);
      } else {
        subs = await db
          .select({ endpoint: pushSubscriptions.endpoint, keys: pushSubscriptions.keys })
          .from(pushSubscriptions);
      }

      let sent = 0, failed = 0, expired = 0;
      for (const sub of subs) {
        const res = await sendPushNotification(sub, {
          title: "LFF Test · Notifications are on",
          body: "If you can see this, shop orders will ping this device.",
          url: "/admin/leads",
        });
        if (res.success) sent++;
        else if (res.error === "subscription_expired") {
          expired++;
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else failed++;
      }

      return { sent, failed, expired };
    }),
});
