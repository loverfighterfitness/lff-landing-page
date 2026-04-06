import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb, getCalculatorLeads } from "../db";
import { calculatorLeads, smsJobs } from "../../drizzle/schema";
import { sendSMS } from "../_core/sms";
import { enqueueSmsJob } from "../smsScheduler";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { sendPushNotification } from "../_core/push";
import { pushSubscriptions } from "../../drizzle/schema";

/**
 * Format SMS message with personalization
 */
function formatSMS1(name: string, tdee: number, protein: number, carbs: number, fats: number, link: string): string {
  return `Hi ${name}! 👋 Your personalized macros are ready:\n\nDaily calories: ${tdee}\nProtein: ${protein}g | Carbs: ${carbs}g | Fats: ${fats}g\n\nGet your full breakdown & tips: ${link}\n\n- Levi @ LFF`;
}

function formatSMS2(name: string): string {
  return `${name}, Ruby went from 0 to comp-ready in 12 weeks 💪 She used personalized macros + my coaching. Want to know her secret? Reply CALL or visit www.loverfighterfitness.com`;
}

function formatSMS3(name: string, link: string): string {
  return `Ready to transform your body? I have limited spots for personalized coaching this month. Let's chat about your goals. Book your free consultation: ${link}`;
}

/**
 * Schedule SMS to be sent at a specific time
 */
async function scheduleSMS(leadId: number, phone: string, message: string, delayMs: number, smsNumber: 1 | 2 | 3) {
  setTimeout(async () => {
    try {
      const result = await sendSMS({ phone, message });

      if (result.success) {
        // Update database with SMS sent status
        const db = await getDb();
        if (!db) {
          console.error(`[SMS] Database not available for SMS #${smsNumber}`);
          return;
        }

        const updateData: Record<string, any> = {};
        if (smsNumber === 1) {
          updateData.sms1SentAt = new Date();
          updateData.sms1MessageId = result.messageId;
        } else if (smsNumber === 2) {
          updateData.sms2SentAt = new Date();
          updateData.sms2MessageId = result.messageId;
        } else if (smsNumber === 3) {
          updateData.sms3SentAt = new Date();
          updateData.sms3MessageId = result.messageId;
        }

        await db
          .update(calculatorLeads)
          .set(updateData)
          .where(eq(calculatorLeads.id, leadId));

        console.log(`[SMS] Sent SMS #${smsNumber} to lead ${leadId}`);
      } else {
        console.error(`[SMS] Failed to send SMS #${smsNumber} to lead ${leadId}:`, result.error);
      }
    } catch (error) {
      console.error(`[SMS] Error scheduling SMS #${smsNumber}:`, error);
    }
  }, delayMs);
}

export const calculatorRouter = router({
  /**
   * Protected query — get all calculator leads for admin dashboard
   */
  getLeads: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getCalculatorLeads(500);
    } catch (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch leads" });
    }
  }),

  /**
   * Protected mutation — update notes for a lead
   */
  updateNotes: protectedProcedure
    .input(z.object({ id: z.number().int(), notes: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(calculatorLeads).set({ notes: input.notes }).where(eq(calculatorLeads.id, input.id));
      return { success: true };
    }),

  /**
   * Protected mutation — update follow-up reminder for a lead
   */
  updateFollowUp: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      followUpDate: z.string().nullable(),
      followUpNote: z.string().max(500).nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(calculatorLeads).set({
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        followUpNote: input.followUpNote,
      }).where(eq(calculatorLeads.id, input.id));
      return { success: true };
    }),

  /**
   * Protected mutation — update pipeline status for a lead
   */
  updateStatus: protectedProcedure
    .input(z.object({ id: z.number().int(), status: z.enum(["new", "contacted", "converted", "not_interested"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(calculatorLeads).set({ leadStatus: input.status }).where(eq(calculatorLeads.id, input.id));
      return { success: true };
    }),

  /**
   * Protected query — get all SMS jobs for admin dashboard
   */
  getSmsJobs: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // Join sms_jobs with calculator_leads to get lead name
    const jobs = await db
      .select({
        id: smsJobs.id,
        leadId: smsJobs.leadId,
        phone: smsJobs.phone,
        message: smsJobs.message,
        smsNumber: smsJobs.smsNumber,
        sendAt: smsJobs.sendAt,
        sentAt: smsJobs.sentAt,
        status: smsJobs.status,
        errorMessage: smsJobs.errorMessage,
        messageId: smsJobs.messageId,
        createdAt: smsJobs.createdAt,
        leadName: calculatorLeads.name,
      })
      .from(smsJobs)
      .leftJoin(calculatorLeads, eq(smsJobs.leadId, calculatorLeads.id))
      .orderBy(smsJobs.sendAt);
    return jobs;
  }),

  /**
   * Protected mutation — retry a failed SMS job
   */
  retrySmsJob: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Reset the job to pending and set sendAt to now so it fires on next poll
      await db
        .update(smsJobs)
        .set({ status: "pending", sendAt: new Date(), errorMessage: null, sentAt: null })
        .where(eq(smsJobs.id, input.id));
      return { success: true };
    }),

  /**
   * Public mutation — submit calculator and trigger SMS automation
   * Accepts pre-calculated results from the frontend to ensure SMS matches what the user saw
   */
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        email: z.string().email(),
        phone: z.string().min(1).max(30).optional(),
        age: z.number().int().min(13).max(120),
        weight: z.number().min(30).max(300),
        height: z.number().int().min(100).max(250),
        // Goal selected by user
        goal: z.enum(["extremeCut", "moderateCut", "maintain", "leanBulk"]).default("maintain"),
        // Referral code if the user arrived via a referral link
        referredBy: z.string().max(32).optional(),
        // Pre-calculated results from the frontend — used directly in SMS
        tdee: z.number().int().min(500).max(10000),
        bmr: z.number().int().min(500).max(10000),
        protein: z.number().int().min(0).max(1000),
        carbs: z.number().int().min(0).max(2000),
        fats: z.number().int().min(0).max(1000),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log("[Calculator] Received input:", input);

        const { tdee, bmr, protein, carbs, fats, goal } = input;
        const goalLabels: Record<string, string> = {
          extremeCut: "Extreme Cut (-750 cal)",
          moderateCut: "Moderate Cut (-400 cal)",
          maintain: "Maintain",
          leanBulk: "Lean Bulk (+250 cal)",
        };
        const goalLabel = goalLabels[goal] ?? goal;
        console.log("[Calculator] Using frontend-calculated macros:", { tdee, bmr, protein, carbs, fats });

        // Save to database
        const db = await getDb();
        if (!db) {
          console.error("[Calculator] Database connection failed");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        console.log("[Calculator] Inserting lead into database...");
        const result = await db.insert(calculatorLeads).values({
          name: input.name,
          email: input.email,
          phone: input.phone || "unknown",
          age: input.age,
          weight: input.weight,
          height: input.height,
          goal,
          tdee,
          bmr,
          protein,
          carbs,
          fats,
          smsStatus: "pending",
          referredBy: input.referredBy ? input.referredBy.toUpperCase() : null,
        });

        console.log("[Calculator] Insert result:", JSON.stringify(result));
        
        // Extract leadId from Drizzle insert result
        let leadId: number = 0;
        if (Array.isArray(result) && result[0]?.insertId) {
          leadId = Number(result[0].insertId);
        } else if ((result as any)?.insertId) {
          leadId = Number((result as any).insertId);
        }
        
        console.log("[Calculator] Extracted leadId:", leadId, "from result:", result);
        
        if (!leadId || leadId === 0) {
          console.error("[Calculator] Failed to get lead ID from insert result, result was:", result);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create calculator lead",
          });
        }
        console.log("[Calculator] Lead created with ID:", leadId);

        // Fire owner notifications (non-blocking — never fail the request)
        const notifyContent = `New calculator lead!

Name: ${input.name}
Email: ${input.email}
Phone: ${input.phone || "not provided"}
Goal: ${goalLabel}

Macros:
• Calories: ${tdee} kcal/day
• Protein: ${protein}g
• Carbs: ${carbs}g
• Fats: ${fats}g

Age: ${input.age} | Weight: ${input.weight}kg | Height: ${input.height}cm`;

        // Manus in-app notification
        notifyOwner({
          title: `🎯 New LFF Lead: ${input.name}`,
          content: notifyContent,
        }).catch((e) => console.warn("[Notify] Manus notification failed:", e));

        // Email notification to loverfighterfitness@gmail.com
        sendEmail({
          to: "loverfighterfitness@gmail.com",
          subject: `🎯 New LFF Lead: ${input.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f7f2; border-radius: 12px;">
              <h2 style="color: #54412F; margin-bottom: 4px;">New Calculator Lead 🎯</h2>
              <p style="color: #888; margin-top: 0;">Someone just used the macro calculator on your website.</p>
              <hr style="border: none; border-top: 1px solid #e0ddd5; margin: 20px 0;" />
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold; width: 120px;">Name</td><td style="padding: 8px 0; color: #333;">${input.name}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Email</td><td style="padding: 8px 0; color: #333;">${input.email}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Phone</td><td style="padding: 8px 0; color: #333;">${input.phone || "not provided"}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Goal</td><td style="padding: 8px 0; color: #333;">${goalLabel}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Age</td><td style="padding: 8px 0; color: #333;">${input.age}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Weight</td><td style="padding: 8px 0; color: #333;">${input.weight}kg</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Height</td><td style="padding: 8px 0; color: #333;">${input.height}cm</td></tr>
              </table>
              <hr style="border: none; border-top: 1px solid #e0ddd5; margin: 20px 0;" />
              <h3 style="color: #54412F; margin-bottom: 12px;">Their Macros</h3>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <div style="background: #54412F; color: #EAE6D2; padding: 16px 24px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold;">${tdee}</div>
                  <div style="font-size: 12px; opacity: 0.7;">CALORIES</div>
                </div>
                <div style="background: #EAE6D2; color: #54412F; padding: 16px 24px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold;">${protein}g</div>
                  <div style="font-size: 12px; opacity: 0.7;">PROTEIN</div>
                </div>
                <div style="background: #EAE6D2; color: #54412F; padding: 16px 24px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold;">${carbs}g</div>
                  <div style="font-size: 12px; opacity: 0.7;">CARBS</div>
                </div>
                <div style="background: #EAE6D2; color: #54412F; padding: 16px 24px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold;">${fats}g</div>
                  <div style="font-size: 12px; opacity: 0.7;">FATS</div>
                </div>
              </div>
              <hr style="border: none; border-top: 1px solid #e0ddd5; margin: 20px 0;" />
              <p style="color: #888; font-size: 13px;">SMS #1 has been sent automatically. SMS #2 fires in 2 days, SMS #3 in 5 days.</p>
            </div>
          `,
        }).catch((e) => console.warn("[Email] Notification failed:", e));

        // Push notification to all subscribed devices
        (async () => {
          try {
            const subs = await db.select().from(pushSubscriptions);
            for (const sub of subs) {
              const result = await sendPushNotification(
                { endpoint: sub.endpoint, keys: sub.keys },
                {
                  title: `🎯 New Lead: ${input.name}`,
                  body: `${goalLabel} · ${tdee} cal · ${protein}g protein`,
                  url: "/admin/leads",
                }
              );
              // Clean up expired subscriptions
              if (result.error === "subscription_expired") {
                await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
              }
            }
          } catch (e) {
            console.warn("[Push] Notification failed:", e);
          }
        })();

        // Send SMS #1 immediately with the exact numbers the user saw on screen
        console.log("[Calculator] Phone number:", input.phone, "Lead ID:", leadId);
        if (input.phone && leadId > 0) {
          console.log("[Calculator] Sending SMS #1 to", input.phone);
          const sms1Message = formatSMS1(input.name, tdee, protein, carbs, fats, "https://www.loverfighterfitness.com/calculator");
          
          try {
            const sms1Result = await sendSMS({ phone: input.phone, message: sms1Message });
            if (sms1Result.success) {
              console.log("[Calculator] SMS #1 sent successfully, message ID:", sms1Result.messageId);
              await db
                .update(calculatorLeads)
                .set({
                  sms1SentAt: new Date(),
                  sms1MessageId: sms1Result.messageId,
                })
                .where(eq(calculatorLeads.id, leadId));
            } else {
              console.error("[Calculator] SMS #1 failed:", sms1Result.error);
            }
          } catch (smsError) {
            console.error("[Calculator] Error sending SMS #1:", smsError);
          }

          // Enqueue SMS #2 for day 2 (persistent — survives server restarts)
          await enqueueSmsJob({
            leadId,
            phone: input.phone,
            message: formatSMS2(input.name),
            smsNumber: 2,
            delayMs: 2 * 24 * 60 * 60 * 1000,
          });

          // Enqueue SMS #3 for day 5 (persistent — survives server restarts)
          await enqueueSmsJob({
            leadId,
            phone: input.phone,
            message: formatSMS3(input.name, "https://tinyurl.com/yov35eof"),
            smsNumber: 3,
            delayMs: 5 * 24 * 60 * 60 * 1000,
          });
        }

        return {
          success: true,
          results: {
            tdee,
            bmr,
            protein,
            carbs,
            fats,
          },
        };
      } catch (error) {
        console.error("[Calculator] Failed to submit:", error);
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Calculator error: ${errorMsg}`,
        });
      }
    }),
});
