import { describe, expect, it } from "vitest";
import { emailFromMessage, leadShortcutLink, smsLink, snapIntro } from "./snapLead";

const decode = (link: string) => {
  const url = new URL(link);
  return { name: url.searchParams.get("name"), input: url.searchParams.get("input"), data: JSON.parse(url.searchParams.get("text")!) };
};

describe("emailFromMessage", () => {
  it("pulls the Email line out of an imported lead message", () => {
    expect(emailFromMessage("wants a program\nEmail: jo.smith@gmail.com\nJoined Snap: 3/11")).toBe("jo.smith@gmail.com");
  });
  it("is empty when there's no email", () => {
    expect(emailFromMessage("Joined Snap: 3/11")).toBe("");
    expect(emailFromMessage(null)).toBe("");
  });
});

describe("leadShortcutLink", () => {
  it("runs LFF Lead with the contact fields and the prefilled sms link", () => {
    const { name, input, data } = decode(
      leadShortcutLink({ name: "JO-ANNE  o'brien smith", phone: "0416 132 571", message: "Email: jo@x.com" })
    );
    expect(name).toBe("LFF Lead");
    expect(input).toBe("text");
    expect(data).toMatchObject({ first: "Jo-Anne", last: "O'Brien Smith", phone: "0416132571", email: "jo@x.com" });
    expect(data.sms).toBe(smsLink("0416132571", snapIntro("JO-ANNE  o'brien smith")));
    expect(decodeURIComponent(data.sms)).toContain("Hey Jo-anne !");
  });
  it("handles a single name and no email", () => {
    const { data } = decode(leadShortcutLink({ name: "Tane", phone: "0402284352" }));
    expect(data).toMatchObject({ first: "Tane", last: "", email: "" });
  });
});
