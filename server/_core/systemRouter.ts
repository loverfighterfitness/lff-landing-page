import { z } from "zod";
import { notifyOwner } from "./notification";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./cookies";
import { ADMIN_COOKIE, adminCookieValue, adminProcedure, isAdminPassword, publicProcedure, router } from "./trpc";

// Slow down password guessing: 10 wrong attempts per IP per 15 minutes.
const failedLogins = new Map<string, { count: number; until: number }>();
function clientIp(req: { headers: Record<string, unknown>; ip?: string }) {
  for (const h of ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"]) {
    const v = req.headers[h];
    if (typeof v === "string" && v) return v.split(",")[0].trim();
  }
  return req.ip ?? "unknown";
}

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  /** Lets the admin login screen check a password without loading any data. */
  adminCheck: adminProcedure.query(() => ({ ok: true }) as const),

  /** Admin login: checks the password and sets a 1-year httpOnly cookie. */
  adminLogin: publicProcedure
    .input(z.object({ password: z.string().min(1).max(200) }))
    .mutation(({ ctx, input }) => {
      const ip = clientIp(ctx.req);
      const now = Date.now();
      const record = failedLogins.get(ip);
      if (record && record.until > now && record.count >= 10) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again in 15 minutes." });
      }
      if (!isAdminPassword(input.password)) {
        const fresh = !record || record.until <= now;
        failedLogins.set(ip, { count: fresh ? 1 : record.count + 1, until: fresh ? now + 15 * 60_000 : record.until });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Wrong password" });
      }
      failedLogins.delete(ip);
      const token = adminCookieValue(input.password);
      ctx.res.cookie(ADMIN_COOKIE, token, {
        ...getSessionCookieOptions(ctx.req),
        httpOnly: true,
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
      return { ok: true, token } as const;
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
