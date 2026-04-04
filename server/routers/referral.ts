import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { referralCodes, calculatorLeads } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";

export const referralRouter = router({
  /**
   * Public — validate a referral code exists and is active.
   * Called when someone lands on /ref/[code] to confirm the code is valid.
   */
  validate: publicProcedure
    .input(z.object({ code: z.string().min(1).max(32) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, referrerName: null };
      const rows = await db
        .select({ id: referralCodes.id, referrerName: referralCodes.referrerName, active: referralCodes.active })
        .from(referralCodes)
        .where(eq(referralCodes.code, input.code.toUpperCase()))
        .limit(1);
      if (!rows.length || rows[0].active !== "yes") return { valid: false, referrerName: null };
      return { valid: true, referrerName: rows[0].referrerName };
    }),

  /**
   * Admin — get all referral codes with usage counts.
   */
  getCodes: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const codes = await db.select().from(referralCodes).orderBy(referralCodes.createdAt);

    // Get usage counts per code
    const usageCounts = await db
      .select({
        referredBy: calculatorLeads.referredBy,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(calculatorLeads)
      .groupBy(calculatorLeads.referredBy);

    const usageMap: Record<string, number> = {};
    for (const row of usageCounts) {
      if (row.referredBy) usageMap[row.referredBy] = Number(row.count);
    }

    return codes.map((c) => ({
      ...c,
      usageCount: usageMap[c.code] ?? 0,
    }));
  }),

  /**
   * Admin — get leads that came from a specific referral code.
   */
  getLeadsForCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select({
          id: calculatorLeads.id,
          name: calculatorLeads.name,
          email: calculatorLeads.email,
          phone: calculatorLeads.phone,
          goal: calculatorLeads.goal,
          leadStatus: calculatorLeads.leadStatus,
          createdAt: calculatorLeads.createdAt,
        })
        .from(calculatorLeads)
        .where(eq(calculatorLeads.referredBy, input.code.toUpperCase()))
        .orderBy(calculatorLeads.createdAt);
    }),

  /**
   * Admin — create a new referral code.
   */
  createCode: protectedProcedure
    .input(z.object({
      code: z.string().min(2).max(32).regex(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, hyphens, or underscores"),
      referrerName: z.string().min(1).max(255),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      try {
        await db.insert(referralCodes).values({
          code: input.code.toUpperCase(),
          referrerName: input.referrerName,
          notes: input.notes ?? null,
        });
        return { success: true };
      } catch (e: any) {
        if (e?.message?.includes("Duplicate")) {
          throw new TRPCError({ code: "CONFLICT", message: "That code already exists" });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Admin — toggle a referral code active/inactive.
   */
  toggleCode: protectedProcedure
    .input(z.object({ id: z.number().int(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(referralCodes)
        .set({ active: input.active ? "yes" : "no" })
        .where(eq(referralCodes.id, input.id));
      return { success: true };
    }),

  /**
   * Admin — delete a referral code.
   */
  deleteCode: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(referralCodes).where(eq(referralCodes.id, input.id));
      return { success: true };
    }),
});
