import { initTRPC, TRPCError } from "@trpc/server";
import { createHash, timingSafeEqual } from "crypto";
import { parse as parseCookie } from "cookie";
import superjson from "superjson";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const ADMIN_COOKIE = "lff_admin";

function safeEqual(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** What the admin cookie holds: a hash of the password, never the password itself. */
export function adminCookieValue(password: string) {
  return createHash("sha256").update(`lff-admin:${password}`).digest("hex");
}

export function isAdminPassword(given: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return !!expected && safeEqual(given, expected);
}

/**
 * True when the request carries the admin password — either the httpOnly
 * cookie set at login (works through Cloudflare) or an x-admin-key header.
 */
export function isAdminRequest(req: TrpcContext["req"]): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const header = req.headers["x-admin-key"];
  if (typeof header === "string" && safeEqual(header, expected)) return true;
  const cookies = parseCookie(req.headers.cookie ?? "");
  const cookie = cookies[ADMIN_COOKIE];
  const ok = typeof cookie === "string" && safeEqual(cookie, adminCookieValue(expected));
  if (!ok && process.env.ADMIN_AUTH_DEBUG) {
    console.log("[AdminAuth] denied", JSON.stringify({
      headerKeys: Object.keys(req.headers),
      cookieNames: Object.keys(cookies),
      cookieLen: typeof cookie === "string" ? cookie.length : null,
      expectedLen: expected.length,
    }));
  }
  return ok;
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
