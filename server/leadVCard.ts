/**
 * GET /api/leads/:id/contact.vcf?admin=<token> — admin only.
 * Returns a lead as a contact card. iPhone shows it with "Create New Contact",
 * so the CRM's "Save contact" button saves name, mobile and email in one tap.
 */
import type { Request, Response } from "express";
import { leadContact, leadVCard } from "@shared/snapLead";
import { isAdminRequest } from "./_core/trpc";
import { getLeadById } from "./db";

export async function handleLeadVCard(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  if (!isAdminRequest(req)) return res.status(401).send("Not signed in");

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).send("Bad lead id");

  try {
    const lead = await getLeadById(id);
    if (!lead || lead.contactMethod === "instagram") return res.status(404).send("Lead not found");

    const contact = leadContact(lead);
    const file = [contact.first, contact.last].filter(Boolean).join(" ").replace(/[^\w -]/g, "") || "lead";
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${file}.vcf"`);
    return res.send(leadVCard(contact));
  } catch (e) {
    console.error("[LeadVCard] failed:", e);
    return res.status(500).send("Couldn't load lead");
  }
}
