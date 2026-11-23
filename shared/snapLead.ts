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

/** A vCard 3.0 contact card. iOS Shortcuts can't put variables in Add New Contact's
 *  phone/email fields, so the Shortcut saves this card instead. */
export function leadVCard(c: { first: string; last: string; phone: string; email: string }) {
  const esc = (v: string) => v.replace(/[\\;,]/g, (ch) => "\\" + ch);
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(c.last)};${esc(c.first)};;;`,
    `FN:${esc([c.first, c.last].filter(Boolean).join(" "))}`,
    `TEL;TYPE=CELL:${c.phone}`,
    c.email && `EMAIL;TYPE=INTERNET:${c.email}`,
    "NOTE:Snap lead (LFF)",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * shortcuts:// link that runs the LFF Lead Shortcut with a JSON dictionary:
 * { first, last, phone, email, vcard, sms }. The Shortcut shows `vcard` to save, then opens `sms`.
 */
export function leadShortcutLink(lead: { name: string; phone: string; message?: string | null }) {
  const [first = "", ...rest] = lead.name.trim().split(/\s+/).map(titleCase);
  const phone = lead.phone.replace(/\s/g, "");
  const contact = { first, last: rest.join(" "), phone, email: emailFromMessage(lead.message) };
  const payload = {
    ...contact,
    vcard: leadVCard(contact),
    sms: smsLink(phone, snapIntro(lead.name)),
  };
  return (
    `shortcuts://run-shortcut?name=${encodeURIComponent(LEAD_SHORTCUT_NAME)}` +
    `&input=text&text=${encodeURIComponent(JSON.stringify(payload))}`
  );
}
