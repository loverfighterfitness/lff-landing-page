import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { insertLead, getLeads } from "../db";
import { notifyOwner } from "../_core/notification";
import { TRPCError } from "@trpc/server";

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
        phone: z.string().min(6, "Enter a valid phone number").max(30),
        goal: z.enum([
          "lose_weight",
          "build_muscle",
          "comp_prep",
          "strength",
          "general_fitness",
          "other",
        ]),
        message: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await insertLead({
          name: input.name,
          phone: input.phone,
          goal: input.goal,
          message: input.message ?? null,
          source: "landing_page",
        });

        // Notify Levi of the new enquiry
        const goalLabel = GOAL_LABELS[input.goal] ?? input.goal;
        await notifyOwner({
          title: `New Lead: ${input.name}`,
          content: [
            `**Name:** ${input.name}`,
            `**Phone:** ${input.phone}`,
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
   * Protected — admin only: list all leads.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return getLeads(200);
  }),
});
