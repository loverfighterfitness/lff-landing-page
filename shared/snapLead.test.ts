import { describe, expect, it } from "vitest";
import { emailFromMessage, leadContact, leadVCard, smsLink, snapIntro } from "./snapLead";

describe("emailFromMessage", () => {
  it("pulls the Email line out of an imported lead message", () => {
    expect(emailFromMessage("wants a program\nEmail: jo.smith@gmail.com\nJoined Snap: 3/11")).toBe("jo.smith@gmail.com");
  });
  it("is empty when there's no email", () => {
    expect(emailFromMessage("Joined Snap: 3/11")).toBe("");
    expect(emailFromMessage(null)).toBe("");
  });
});

describe("leadContact + leadVCard", () => {
  it("title-cases the name, strips phone spaces and builds the card", () => {
    const c = leadContact({ name: "JO-ANNE  o'brien smith", phone: "0416 132 571", message: "Email: jo@x.com" });
    expect(c).toEqual({ first: "Jo-Anne", last: "O'Brien Smith", phone: "0416132571", email: "jo@x.com" });
    expect(leadVCard(c).split("\r\n")).toEqual([
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:O'Brien Smith;Jo-Anne;;;",
      "FN:Jo-Anne O'Brien Smith",
      "TEL;TYPE=CELL:0416132571",
      "EMAIL;TYPE=INTERNET:jo@x.com",
      "NOTE:Snap lead (LFF)",
      "END:VCARD",
    ]);
  });
  it("handles a single name and no email", () => {
    const c = leadContact({ name: "Tane", phone: "0402284352" });
    expect(c).toMatchObject({ first: "Tane", last: "", email: "" });
    expect(leadVCard(c)).not.toContain("EMAIL");
  });
});

describe("smsLink", () => {
  it("carries the whole intro", () => {
    const link = smsLink("0416 132 571", snapIntro("jo"));
    expect(link.startsWith("sms:0416132571?&body=")).toBe(true);
    expect(decodeURIComponent(link.split("body=")[1])).toBe(snapIntro("jo"));
  });
});
