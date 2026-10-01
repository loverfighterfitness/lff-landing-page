import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import type { Character } from "@shared/game/types";
import {
  gameEvents,
  gameRuns,
  gameRunTokens,
  type GameEvent,
  type GameRun,
  type GameRunToken,
  type InsertGameRun,
} from "../drizzle/schema";
import { getDb } from "./db";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

/** The event that's open for submissions right now, if any. */
export async function getActiveEvent(now = new Date()): Promise<GameEvent | null> {
  const rows = await (await db())
    .select()
    .from(gameEvents)
    .where(and(eq(gameEvents.isActive, true), lte(gameEvents.startsAt, now), gte(gameEvents.endsAt, now)))
    .orderBy(desc(gameEvents.id))
    .limit(1);
  return rows[0] ?? null;
}

/** The latest active event regardless of dates — the board shows it before it opens and after it ends. */
export async function getCurrentEvent(): Promise<GameEvent | null> {
  const rows = await (await db())
    .select()
    .from(gameEvents)
    .where(eq(gameEvents.isActive, true))
    .orderBy(desc(gameEvents.id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createRunToken(t: { id: string; seed: number; character: Character }): Promise<void> {
  await (await db()).insert(gameRunTokens).values({ ...t, issuedAt: new Date() });
}

export async function getRunToken(id: string): Promise<GameRunToken | null> {
  const rows = await (await db()).select().from(gameRunTokens).where(eq(gameRunTokens.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Atomically claims the token. False if it was already used (double submit / replayed request). */
export async function markRunTokenUsed(id: string): Promise<boolean> {
  const [result] = await (await db())
    .update(gameRunTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(gameRunTokens.id, id), isNull(gameRunTokens.usedAt)));
  return result.affectedRows === 1;
}

export async function insertRun(run: InsertGameRun): Promise<void> {
  await (await db()).insert(gameRuns).values(run);
}

/** Counted runs for an event, best first. */
export async function getEventRuns(eventId: number): Promise<GameRun[]> {
  return (await db())
    .select()
    .from(gameRuns)
    .where(and(eq(gameRuns.eventId, eventId), eq(gameRuns.removed, false)))
    .orderBy(desc(gameRuns.total))
    .limit(5000);
}

/** Every run for an event including removed ones, newest first. Admin only. */
export async function listEventRunsForAdmin(eventId: number): Promise<GameRun[]> {
  return (await db())
    .select()
    .from(gameRuns)
    .where(eq(gameRuns.eventId, eventId))
    .orderBy(desc(gameRuns.createdAt))
    .limit(1000);
}

export async function setRunRemoved(id: number, removed: boolean): Promise<void> {
  await (await db()).update(gameRuns).set({ removed }).where(eq(gameRuns.id, id));
}

/** Starts a new event and retires the old one (its runs stay in the DB). */
export async function startEvent(e: { name: string; startsAt: Date; endsAt: Date }): Promise<void> {
  const d = await db();
  await d.update(gameEvents).set({ isActive: false }).where(eq(gameEvents.isActive, true));
  await d.insert(gameEvents).values({ ...e, isActive: true });
}
