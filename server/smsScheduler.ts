/**
 * Persistent SMS Job Scheduler
 *
 * Polls the sms_jobs table every 60 seconds and sends any jobs where
 * sendAt <= now and status = 'pending'. This survives server restarts
 * unlike setTimeout-based scheduling.
 */
import { getDb } from "./db";
import { smsJobs, calculatorLeads } from "../drizzle/schema";
import { and, eq, lte } from "drizzle-orm";
import { sendSMS } from "./_core/sms";

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Enqueue an SMS job in the database.
 * Call this instead of setTimeout when scheduling delayed SMS messages.
 */
export async function enqueueSmsJob({
  leadId,
  phone,
  message,
  smsNumber,
  delayMs,
}: {
  leadId: number;
  phone: string;
  message: string;
  smsNumber: 1 | 2 | 3;
  delayMs: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[SmsScheduler] DB not available — cannot enqueue SMS job");
    return;
  }

  const sendAt = new Date(Date.now() + delayMs);

  await db.insert(smsJobs).values({
    leadId,
    phone,
    message,
    smsNumber,
    sendAt,
    status: "pending",
  });

  console.log(`[SmsScheduler] Enqueued SMS #${smsNumber} for lead ${leadId}, sendAt: ${sendAt.toISOString()}`);
}

/**
 * Process all due SMS jobs — called by the scheduler loop.
 */
async function processDueJobs(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const now = new Date();

    // Fetch all pending jobs that are due
    const dueJobs = await db
      .select()
      .from(smsJobs)
      .where(and(eq(smsJobs.status, "pending"), lte(smsJobs.sendAt, now)));

    if (dueJobs.length === 0) return;

    console.log(`[SmsScheduler] Processing ${dueJobs.length} due SMS job(s)`);

    for (const job of dueJobs) {
      try {
        const result = await sendSMS({ phone: job.phone, message: job.message });

        if (result.success) {
          // Mark job as sent
          await db
            .update(smsJobs)
            .set({ status: "sent", sentAt: new Date(), messageId: result.messageId ?? null })
            .where(eq(smsJobs.id, job.id));

          // Update the calculator_leads SMS tracking columns
          const smsNum = job.smsNumber as 1 | 2 | 3;
          const leadUpdate: Record<string, any> = {};
          if (smsNum === 1) {
            leadUpdate.sms1SentAt = new Date();
            leadUpdate.sms1MessageId = result.messageId ?? null;
          } else if (smsNum === 2) {
            leadUpdate.sms2SentAt = new Date();
            leadUpdate.sms2MessageId = result.messageId ?? null;
          } else if (smsNum === 3) {
            leadUpdate.sms3SentAt = new Date();
            leadUpdate.sms3MessageId = result.messageId ?? null;
          }

          await db
            .update(calculatorLeads)
            .set(leadUpdate)
            .where(eq(calculatorLeads.id, job.leadId));

          console.log(`[SmsScheduler] Sent SMS #${job.smsNumber} for lead ${job.leadId} (job ${job.id})`);
        } else {
          // Mark job as failed but keep it for visibility
          await db
            .update(smsJobs)
            .set({ status: "failed", errorMessage: result.error ?? "Unknown error" })
            .where(eq(smsJobs.id, job.id));

          console.error(`[SmsScheduler] Failed SMS #${job.smsNumber} for lead ${job.leadId}:`, result.error);
        }
      } catch (err) {
        await db
          .update(smsJobs)
          .set({ status: "failed", errorMessage: String(err) })
          .where(eq(smsJobs.id, job.id));

        console.error(`[SmsScheduler] Error processing job ${job.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[SmsScheduler] Error fetching due jobs:", err);
  }
}

/**
 * Start the SMS scheduler — polls every 60 seconds.
 * Call this once on server startup.
 */
export function startSmsScheduler(): void {
  if (schedulerInterval) {
    console.warn("[SmsScheduler] Already running — skipping start");
    return;
  }

  console.log("[SmsScheduler] Starting — polling every 60 seconds");

  // Run immediately on start to catch any jobs that were due during downtime
  processDueJobs().catch((e) => console.error("[SmsScheduler] Initial run error:", e));

  schedulerInterval = setInterval(() => {
    processDueJobs().catch((e) => console.error("[SmsScheduler] Poll error:", e));
  }, 60 * 1000);
}

/**
 * Stop the scheduler (for testing / graceful shutdown).
 */
export function stopSmsScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[SmsScheduler] Stopped");
  }
}
