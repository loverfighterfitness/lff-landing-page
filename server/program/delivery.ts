/**
 * LFF Program Delivery
 * Handles secure, emailed delivery of the downloadable program PDF after a
 * successful Stripe Checkout. No public PDF link — buyers receive a signed,
 * expiring download URL by email, validated on the /api/program/download route.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Request, Response } from "express";
import type Stripe from "stripe";
import { ENV } from "../_core/env";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve the PDF across dev (tsx, runs from source) and prod (esbuild bundle in dist/).
// Checked at request time so a missing file is logged clearly rather than crashing on boot.
function resolvePdfPath(): string {
  const candidates = [
    process.env.PROGRAM_PDF_PATH,
    path.join(__dirname, "assets", "hypertrophy-meta.pdf"), // dev: server/program/assets
    path.join(process.cwd(), "server/program/assets/hypertrophy-meta.pdf"),
    path.join(process.cwd(), "dist/assets/hypertrophy-meta.pdf"), // prod: copied by build
  ].filter(Boolean) as string[];
  return candidates.find((c) => fs.existsSync(c)) ?? candidates[1];
}

const DOWNLOAD_FILENAME = "LFF-The-Hypertrophy-Meta.pdf";
const LINK_TTL_DAYS = 30;
// Reuse the Stripe secret as the HMAC key so there's no extra env to configure.
const SIGNING_SECRET = ENV.stripeSecretKey || "lff-program-fallback-secret";

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64url");

function sign(data: string): string {
  return crypto.createHmac("sha256", SIGNING_SECRET).update(data).digest("base64url");
}

/** Build a signed, expiring token bound to the Stripe session id. */
export function makeDownloadToken(sessionId: string): string {
  const payload = {
    sid: sessionId,
    exp: Date.now() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
  const data = b64url(JSON.stringify(payload));
  return `${data}.${sign(data)}`;
}

function verifyToken(token: string): { ok: boolean; expired?: boolean } {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false };
  const [data, sig] = parts;
  const expected = sign(data);
  // Constant-time compare
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return { ok: false };
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return { ok: false, expired: true };
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Express handler: GET /api/program/download?token=... */
export function handleProgramDownload(req: Request, res: Response) {
  const token = String(req.query.token ?? "");
  if (!token) return res.status(400).send("Missing download token.");

  const result = verifyToken(token);
  if (!result.ok) {
    if (result.expired) {
      return res
        .status(410)
        .send(
          "This download link has expired. Reply to your receipt email and Levi will send a fresh one."
        );
    }
    return res.status(403).send("Invalid download link.");
  }

  const pdfPath = resolvePdfPath();
  if (!fs.existsSync(pdfPath)) {
    console.error("[Program] PDF not found at", pdfPath);
    return res.status(500).send("File temporarily unavailable. Please contact loverfighterfitness@gmail.com.");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${DOWNLOAD_FILENAME}"`
  );
  res.setHeader("Cache-Control", "private, no-store");
  fs.createReadStream(pdfPath).pipe(res);
}

/** Called from the Stripe webhook on a completed program_order. */
export async function deliverProgram(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email;
  const name = session.customer_details?.name?.split(" ")[0] ?? "there";
  const amount = session.amount_total
    ? `$${(session.amount_total / 100).toFixed(2)} AUD`
    : "";

  if (!email) {
    console.error("[Program] No customer email on session", session.id);
    await notifyOwner({
      title: "Program sale — MISSING EMAIL",
      content: `A program order completed (${session.id}) but had no email. Deliver manually from Stripe.`,
    });
    return;
  }

  const link = `${ENV.siteUrl}/api/program/download?token=${makeDownloadToken(session.id)}`;

  const html = `
  <div style="background:#54412F;padding:40px 0;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding:0 32px;">
          <p style="color:#CFC6AE;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 18px;">Lover Fighter Fitness</p>
          <h1 style="color:#EAE6D2;font-size:26px;line-height:1.2;margin:0 0 16px;">The Hypertrophy Meta is yours.</h1>
          <p style="color:#E4DEC8;font-size:15px;line-height:1.6;margin:0 0 24px;">Hey ${name} — thanks for grabbing the program. It's the exact upper/lower split I run with my clients. Hit the button below to download your PDF (works on phone or desktop).</p>
          <a href="${link}" style="display:inline-block;background:#EAE6D2;color:#54412F;text-decoration:none;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:14px;padding:14px 28px;border-radius:24px;">Download your program</a>
          <p style="color:#A89A82;font-size:12px;line-height:1.6;margin:28px 0 0;">This link is private to you and works for ${LINK_TTL_DAYS} days. Save the PDF somewhere safe once you've downloaded it. Any issues, just reply to this email.</p>
          <p style="color:#A89A82;font-size:12px;line-height:1.6;margin:18px 0 0;">Train hard, stay consistent.<br><strong style="color:#EAE6D2;">Levi — Coach, LFF</strong></p>
        </td></tr>
      </table>
    </td></tr></table>
  </div>`;

  const sent = await sendEmail({
    to: email,
    subject: "Your program — The Hypertrophy Meta 💪",
    html,
  });

  await notifyOwner({
    title: `Program sale — ${amount}`,
    content: `${name} (${email}) bought The Hypertrophy Meta${amount ? ` for ${amount}` : ""}. Download email ${sent ? "sent" : "FAILED — deliver manually"}.`,
  });
}
