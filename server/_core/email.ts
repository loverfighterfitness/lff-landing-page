import nodemailer from "nodemailer";
import { ENV } from "./env";

/**
 * Send an email via Gmail SMTP using an App Password.
 * Returns true on success, false on failure (never throws).
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!ENV.gmailAppPassword) {
    console.warn("[Email] GMAIL_APP_PASSWORD not set — skipping email");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: ENV.gmailUser,
        pass: ENV.gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `"LFF Website" <${ENV.gmailUser}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}
