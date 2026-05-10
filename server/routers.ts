import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { storageRouter } from "./routers/storage";
import { leadsRouter } from "./routers/leads";
import { calculatorRouter } from "./routers/calculator";
import { pushRouter } from "./routers/push";
import { stripeRouter } from "./routers/stripe";
import { referralRouter } from "./routers/referral";
import { shopRouter } from "./routers/shop";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  storage: storageRouter,
  leads: leadsRouter,
  calculator: calculatorRouter,
  push: pushRouter,
  stripe: stripeRouter,
  referral: referralRouter,
  shop: shopRouter,
});

export type AppRouter = typeof appRouter;
