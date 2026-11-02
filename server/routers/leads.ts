import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { insertLead, getLeads, leadExists } from "../db";
import { notifyOwner } from "../_core/notification";
import { pushToAllDevices } from "../_core/push";
import { sendEmail } from "../_core/email";
import { TRPCError } from "@trpc/server";

/** `leads.source` for rows imported from the Snap PT call sheet. */
export const SNAP_SOURCE = "snap_call_sheet";

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose Weight / Tone Up",
  build_muscle: "Build Muscle / Bulk",
  comp_prep: "Competition Prep",
  strength: "Strength / Powerlifting",
  general_fitness: "General Fitness",
  other: "Other",
};

export const leadsRouter = router({
  /**
   * Public mutation — anyone can submit a lead from the landing page.
   */
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(255),
        contactMethod: z.enum(["text", "instagram"]).default("text"),
        phone: z.string().min(2, "Enter a valid contact handle").max(30),
        goal: z.enum([
          "lose_weight",
          "build_muscle",
          "comp_prep",
          "strength",
          "general_fitness",
          "other",
        ]),
        message: z.string().max(1000).optional(),
        /** Which page the form was on, e.g. "page:/comp-prep-coach-adelaide" */
        source: z.string().regex(/^[a-z0-9:/_-]{1,64}$/).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await insertLead({
          name: input.name,
          contactMethod: input.contactMethod,
          phone: input.phone,
          goal: input.goal,
          message: input.message ?? null,
          source: input.source ?? "landing_page",
        });

        // Notify Levi of the new enquiry — push to his phone + email (never fail the request)
        const goalLabel = GOAL_LABELS[input.goal] ?? input.goal;
        const via = input.contactMethod === "instagram" ? "Instagram" : "Text";
        pushToAllDevices({
          title: `New enquiry: ${input.name}`,
          body: `${goalLabel} · ${via}: ${input.phone}`,
          url: "/admin/leads?tab=enquiries",
        }).catch((e) => console.warn("[Leads] Push failed:", e));
        const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
        sendEmail({
          to: "loverfighterfitness@gmail.com",
          subject: `New coaching enquiry: ${input.name}`,
          html: `<div style="font-family:sans-serif;max-width:560px;padding:20px;background:#f9f7f2;border-radius:12px;color:#333">
            <h2 style="color:#54412F;margin:0 0 12px">New coaching enquiry</h2>
            <p><b>Name:</b> ${esc(input.name)}<br><b>${via}:</b> ${esc(input.phone)}<br><b>Goal:</b> ${esc(goalLabel)}${input.source ? `<br><b>From:</b> ${esc(input.source)}` : ""}</p>
            ${input.message ? `<p><b>Message:</b><br>${esc(input.message)}</p>` : ""}
          </div>`,
        }).catch((e) => console.warn("[Leads] Email failed:", e));

        await notifyOwner({
          title: `New Lead: ${input.name}`,
          content: [
            `**Name:** ${input.name}`,
            `**Contact (${input.contactMethod === "instagram" ? "Instagram" : "Text"}):** ${input.phone}`,
            `**Goal:** ${goalLabel}`,
            input.message ? `**Message:** ${input.message}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        });

        return { success: true };
      } catch (error) {
        console.error("[Leads] Failed to submit lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong. Please try again.",
        });
      }
    }),

  /**
   * Admin only — a Snap PT call-sheet lead assigned to Levi. Called by the
   * Apps Script watcher (business-os/growth/pt-lead-alert.gs) with ?admin=<token>.
   * Deduped on phone, so a re-sent row is a no-op and doesn't re-notify.
   */
  importSnap: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        phone: z.string().min(2).max(30),
        email: z.string().max(320).optional(),
        joined: z.string().max(64).optional(),
        bookedBy: z.string().max(64).optional(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (await leadExists(input.phone, SNAP_SOURCE)) return { created: false };

      const message = [
        input.notes,
        input.email && `Email: ${input.email}`,
        input.joined && `Joined Snap: ${input.joined}`,
        input.bookedBy && `Booked by: ${input.bookedBy}`,
      ]
        .filter(Boolean)
        .join("\n");
      await insertLead({
        name: input.name,
        contactMethod: "text",
        phone: input.phone,
        goal: "general_fitness",
        message: message || null,
        source: SNAP_SOURCE,
      });

      await pushToAllDevices({
        title: `New Snap lead: ${input.name}`,
        body: `${input.phone}${input.notes ? ` · ${input.notes}` : ""}`.slice(0, 180),
        url: "/admin/leads?tab=enquiries",
      }).catch((e) => console.warn("[Leads] Snap push failed:", e));
      const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
      await sendEmail({
        to: "loverfighterfitness@gmail.com",
        subject: `New Snap lead: ${input.name}`,
        html: `<div style="font-family:sans-serif;max-width:560px;padding:20px;background:#f9f7f2;border-radius:12px;color:#333">
          <h2 style="color:#54412F;margin:0 0 12px">New Snap lead assigned to you</h2>
          <p><b>Name:</b> ${esc(input.name)}<br><b>Mobile:</b> <a href="tel:${esc(input.phone.replace(/\s/g, ""))}">${esc(input.phone)}</a></p>
          ${message ? `<p style="white-space:pre-wrap">${esc(message)}</p>` : ""}
        </div>`,
      }).catch((e) => console.warn("[Leads] Snap email failed:", e));

      return { created: true };
    }),

  /**
   * Protected — admin only: list all leads.
   */
  list: protectedProcedure.query(async () => {
    return getLeads(200);
  }),
});
