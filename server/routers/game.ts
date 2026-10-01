import { createHash, randomInt, randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { MAX_EVENTS_PER_LIFT } from "@shared/game/config";
import { CHARACTERS } from "@shared/game/types";
import { checkRun } from "@shared/game/validate";
import { clientIp } from "../_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { buildBoard, entrantsCsv } from "../gameBoard";
import {
  createRunToken,
  getActiveEvent,
  getCurrentEvent,
  getEventRuns,
  getRunToken,
  insertRun,
  listEventRunsForAdmin,
  markRunTokenUsed,
  setRunRemoved,
  startEvent,
} from "../gameDb";

const REJECTED = "That run didn't check out — run it back.";
const SUBMIT_LIMIT = 30;
const START_LIMIT = 120;
const SUBMIT_WINDOW_MS = 60 * 60_000;
const SWEEP_THRESHOLD = 10_000;
const submits = new Map<string, { count: number; until: number }>();

/** Counts a submission against `key`; true once the hourly limit is exceeded. */
function overLimit(key: string, now: number, limit = SUBMIT_LIMIT): boolean {
  if (submits.size > SWEEP_THRESHOLD) {
    submits.forEach((v, k) => {
      if (v.until <= now) submits.delete(k);
    });
  }
  const rec = submits.get(key);
  if (!rec || rec.until <= now) {
    submits.set(key, { count: 1, until: now + SUBMIT_WINDOW_MS });
    return false;
  }
  rec.count++;
  return rec.count > limit;
}

/** Test hook. */
export function resetGameRateLimits() {
  submits.clear();
}

/** Test hook. */
export function rateLimitSize() {
  return submits.size;
}

const handleSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/^@/, ""))
  .pipe(z.string().regex(/^[A-Za-z0-9._]{1,30}$/, "Enter your Instagram handle"));

const logSchema = z
  .array(z.object({ tick: z.number().int().min(0).max(100_000), down: z.boolean() }))
  .max(MAX_EVENTS_PER_LIFT);

export const gameRouter = router({
  startRun: publicProcedure
    .input(z.object({ character: z.enum(CHARACTERS) }))
    .mutation(async ({ ctx, input }) => {
      if (overLimit(`start:${clientIp(ctx.req)}`, Date.now(), START_LIMIT)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Easy, champ — too many runs. Have a rest and try again in a bit." });
      }
      const runId = randomUUID();
      const seed = randomInt(0, 2 ** 32);
      await createRunToken({ id: runId, seed, character: input.character });
      const event = await getActiveEvent();
      return { runId, seed, eventOpen: !!event };
    }),

  submitRun: publicProcedure
    .input(
      z.object({
        runId: z.string().uuid(),
        handle: handleSchema,
        email: z.string().trim().toLowerCase().email().max(320),
        marketingOptIn: z.boolean(),
        logs: z.object({ bench: logSchema, squat: logSchema, deadlift: logSchema }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const ip = clientIp(ctx.req);
      const ipLimited = overLimit(`ip:${ip}`, now);
      const emailLimited = overLimit(`email:${input.email}`, now);
      if (ipLimited || emailLimited) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Easy, champ — too many runs. Have a rest and try again in a bit." });
      }

      const event = await getActiveEvent();
      if (!event) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The comp isn't open right now — keep training for the next one." });
      }

      const token = await getRunToken(input.runId);
      if (!token || token.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: REJECTED });

      const check = checkRun(Number(token.seed), input.logs, now - token.issuedAt.getTime());
      if (!check.ok) {
        console.warn("[Game] rejected run", input.runId, check.reason);
        // Burn the token so one seed can't be retried with different logs.
        await markRunTokenUsed(token.id);
        throw new TRPCError({ code: "BAD_REQUEST", message: REJECTED });
      }
      if (!(await markRunTokenUsed(token.id))) throw new TRPCError({ code: "BAD_REQUEST", message: REJECTED });

      await insertRun({
        eventId: event.id,
        handle: input.handle,
        email: input.email,
        marketingOptIn: input.marketingOptIn,
        character: token.character,
        benchScore: check.scores.bench,
        squatScore: check.scores.squat,
        deadliftScore: check.scores.deadlift,
        total: check.total,
        runTokenId: token.id,
        ipHash: createHash("sha256").update(`lff-gym:${ip}`).digest("hex"),
      });

      const board = buildBoard(await getEventRuns(event.id));
      return { total: check.total, scores: check.scores, rank: board.ranks.get(input.email) ?? null };
    }),

  leaderboard: publicProcedure.query(async () => {
    const event = await getCurrentEvent();
    if (!event) return { event: null, rows: [], teams: buildBoard([]).teams };
    const board = buildBoard(await getEventRuns(event.id));
    return {
      event: { name: event.name, startsAt: event.startsAt, endsAt: event.endsAt },
      rows: board.rows.slice(0, 20),
      teams: board.teams,
    };
  }),

  admin: router({
    overview: adminProcedure.query(async () => {
      const event = await getCurrentEvent();
      return { event, runs: event ? await listEventRunsForAdmin(event.id) : [] };
    }),

    setRunRemoved: adminProcedure
      .input(z.object({ id: z.number().int().positive(), removed: z.boolean() }))
      .mutation(async ({ input }) => {
        await setRunRemoved(input.id, input.removed);
        return { ok: true } as const;
      }),

    startEvent: adminProcedure
      .input(
        z
          .object({ name: z.string().trim().min(1).max(120), startsAt: z.coerce.date(), endsAt: z.coerce.date() })
          .refine((e) => e.endsAt > e.startsAt, { message: "End must be after start" }),
      )
      .mutation(async ({ input }) => {
        await startEvent(input);
        return { ok: true } as const;
      }),

    entrantsCsv: adminProcedure.query(async () => {
      const event = await getCurrentEvent();
      return { csv: entrantsCsv(event ? await getEventRuns(event.id) : []) };
    }),
  }),
});
