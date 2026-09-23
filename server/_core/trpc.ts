import { initTRPC, TRPCError } from "@trpc/server";
import { timingSafeEqual } from "crypto";
import superjson from "superjson";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** True when the request carries the admin password (x-admin-key header). */
export function isAdminRequest(req: TrpcContext["req"]): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const given = req.headers["x-admin-key"];
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Admin-only. Leads, orders, stock, referrals and media all sit behind this —
 * fails closed if ADMIN_PASSWORD isn't set on the server.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!isAdminRequest(ctx.req)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next();
});
export const adminProcedure = protectedProcedure;
