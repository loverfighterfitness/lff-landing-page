/**
 * Snap PT call-sheet leads: Levi's intro text, and the one-tap link that runs
 * his "LFF Lead" iPhone Shortcut (saves the contact, then opens Messages with
 * the intro typed in). Setup: business-os/growth/lff-lead-shortcut.md
 */

/** Name of the Shortcut on Levi's iPhone. Must match exactly. */
export const LEAD_SHORTCUT_NAME = "LFF Lead";

const titleCase = (word: string) =>
  word
    .toLowerCase()
    .replace(/(^|[-'])([a-zà-ÿ])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());

/** Levi's first text to a Snap call-sheet lead, with their first name filled in. */
export function snapIntro(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  const name = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return [
    `Hey ${name} ! I'm Levi, Personal Trainer at Snap Fitness Aston Hills.`,
    "",
    "I was just wondering when you'd like to do your free discovery session that we're doing for all new sign ups. It's just a chat in club to answer any questions you might have about the gym and explain my services 😊",
    "",
    "My services include:",
    "- Online coaching",
    "- Custom programs",
    "- Face to face sessions",
    "- and more!",
  ].join("\n");
}

/** `sms:` link with the text prefilled ("?&body=" works on both iOS and Android). */
export function smsLink(phone: string, body?: string | null) {
  return `sms:${phone.replace(/\s/g, "")}${body ? `?&body=${encodeURIComponent(body)}` : ""}`;
}

/** The importer stores the sheet's email as an "Email: x" line in the lead message. */
export function emailFromMessage(message?: string | null) {
  const m = message?.match(/^Email:\s*(\S+@\S+)\s*$/m);
  return m ? m[1] : "";
}

/**
 * shortcuts:// link that runs the LFF Lead Shortcut with a JSON dictionary:
 * { first, last, phone, email, sms }. The Shortcut adds the contact, then opens `sms`.
 */
export function leadShortcutLink(lead: { name: string; phone: string; message?: string | null }) {
  const [first = "", ...rest] = lead.name.trim().split(/\s+/).map(titleCase);
  const phone = lead.phone.replace(/\s/g, "");
  const payload = {
    first,
    last: rest.join(" "),
    phone,
    email: emailFromMessage(lead.message),
    sms: smsLink(phone, snapIntro(lead.name)),
  };
  return (
    `shortcuts://run-shortcut?name=${encodeURIComponent(LEAD_SHORTCUT_NAME)}` +
    `&input=text&text=${encodeURIComponent(JSON.stringify(payload))}`
  );
}
