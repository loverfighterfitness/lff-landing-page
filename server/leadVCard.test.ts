import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getLeadById: vi.fn(async (id: number) =>
    id === 7
      ? { id: 7, name: "jo smith", phone: "0416 132 571", contactMethod: "text", message: "Email: jo@x.com", source: "snap_call_sheet" }
      : undefined
  ),
}));

import { handleLeadVCard } from "./leadVCard";
import { adminCookieValue } from "./_core/trpc";

function call(id: string, token?: string) {
  const req = { params: { id }, headers: {}, url: `/api/leads/${id}/contact.vcf${token ? `?admin=${token}` : ""}` } as any;
  const out = { status: 200, headers: {} as Record<string, string>, body: "" };
  const res = {
    setHeader: (k: string, v: string) => { out.headers[k.toLowerCase()] = v; },
    status(code: number) { out.status = code; return res; },
    send(b: string) { out.body = b; return res; },
  } as any;
  return handleLeadVCard(req, res).then(() => out);
}

describe("GET /api/leads/:id/contact.vcf", () => {
  const prev = process.env.ADMIN_PASSWORD;
  beforeEach(() => { process.env.ADMIN_PASSWORD = "test-password"; });
  afterEach(() => { process.env.ADMIN_PASSWORD = prev; });

  it("refuses without the admin token", async () => {
    expect((await call("7")).status).toBe(401);
    expect((await call("7", "wrong")).status).toBe(401);
  });

  it("returns the lead as a vCard", async () => {
    const out = await call("7", adminCookieValue("test-password"));
    expect(out.status).toBe(200);
    expect(out.headers["content-type"]).toBe("text/vcard; charset=utf-8");
    expect(out.headers["content-disposition"]).toBe('inline; filename="Jo Smith.vcf"');
    expect(out.body).toContain("FN:Jo Smith");
    expect(out.body).toContain("TEL;TYPE=CELL:0416132571");
    expect(out.body).toContain("EMAIL;TYPE=INTERNET:jo@x.com");
  });

  it("404s an unknown lead and 400s a bad id", async () => {
    const t = adminCookieValue("test-password");
    expect((await call("99", t)).status).toBe(404);
    expect((await call("abc", t)).status).toBe(400);
  });
});
