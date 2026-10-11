import { describe, expect, it } from "vitest";
import { routeStatus, seoBody, seoHead } from "./_core/seo";
import { localPages, localPageByPath } from "@shared/localPages";

describe("local service pages", () => {
  it.each(localPages.map(p => p.path))("%s is indexable with crawler copy and structured data", path => {
    const page = localPageByPath[path];
    expect(routeStatus(path)).toEqual({ status: 200, noindex: false });

    const body = seoBody(path);
    expect(body).toContain(`<h1`);
    expect(body).toContain(page.h1);
    for (const faq of page.faqs) expect(body).toContain(faq.question.replace(/'/g, "'"));

    const head = seoHead(path);
    expect(head).toContain('"@type":"Service"');
    expect(head).toContain('"@type":"FAQPage"');
    expect(head).toContain('"@type":"BreadcrumbList"');
  });

  it("keeps titles and descriptions inside what Google shows", () => {
    for (const p of localPages) {
      expect(p.title.length, p.title).toBeLessThanOrEqual(60);
      expect(p.description.length, p.description).toBeLessThanOrEqual(160);
    }
  });

  it("only links to pages that exist", () => {
    for (const p of localPages) for (const r of p.related) expect(localPageByPath[r], r).toBeDefined();
  });

  it("links every local page from the homepage crawler copy", () => {
    const home = seoBody("");
    for (const p of localPages) expect(home).toContain(`href="${p.path}"`);
  });
});

describe("learn articles", () => {
  it("serves the index and every article with crawler copy and Article schema", async () => {
    const { articles, LEARN_INDEX } = await import("@shared/articles");
    expect(routeStatus(LEARN_INDEX.path)).toEqual({ status: 200, noindex: false });
    for (const a of articles) {
      const path = `/learn/${a.slug}`;
      expect(routeStatus(path)).toEqual({ status: 200, noindex: false });
      expect(seoBody(path)).toContain(a.h1);
      expect(seoHead(path)).toContain('"@type":"Article"');
      expect(seoBody(LEARN_INDEX.path)).toContain(`href="${path}"`);
      expect(a.title.length, a.title).toBeLessThanOrEqual(60);
      expect(a.description.length, a.description).toBeLessThanOrEqual(160);
      expect(localPageByPath[a.cta.path], a.cta.path).toBeDefined();
    }
    expect(routeStatus("/learn/not-an-article").status).toBe(404);
  });
});
