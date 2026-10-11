import { faqs } from "@shared/faqs";
import { localPages, localPageByPath, type LocalPage } from "@shared/localPages";
import { articles, LEARN_INDEX, type Article } from "@shared/articles";

// Server-rendered extras for crawlers: JSON-LD structured data, plus a plain-HTML
// copy of the page's key content inside #root. React replaces #root's children on
// mount, so visitors see the app; crawlers that don't run JS (ChatGPT, Perplexity,
// link previews) still get real text instead of an empty div.

const SITE = "https://www.loverfighterfitness.com";
const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/apple-touch-icon_33e86517.png";
const OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/lff-og-image-real_e16693c0.png";

// Every path the client router renders. Anything else gets a real 404 status.
const KNOWN_PATHS = new Set([
  "", "/calculator", "/admin", "/admin/leads", "/shop", "/program", "/game", "/success", "/404",
  ...localPages.map(p => p.path),
  LEARN_INDEX.path,
  ...articles.map(a => `/learn/${a.slug}`),
]);
const NOINDEX_PATHS = new Set(["/admin", "/admin/leads", "/success", "/404", "/game"]);

export function routeStatus(path: string): { status: number; noindex: boolean } {
  if (path.startsWith("/ref/")) return { status: 200, noindex: true };
  if (!KNOWN_PATHS.has(path)) return { status: 404, noindex: true };
  return { status: 200, noindex: NOINDEX_PATHS.has(path) };
}

const business = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE}/#business`,
  name: "Lover Fighter Fitness",
  alternateName: "LFF",
  url: SITE,
  logo: LOGO,
  image: OG_IMAGE,
  description:
    "Online comp prep, bodybuilding and strength coaching with Levi Hurst. Custom programming, weekly check-ins, posing feedback and nutrition coaching.",
  email: "loverfighterfitness@gmail.com",
  priceRange: "$80–$120 AUD / week",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mount Barker",
    addressRegion: "SA",
    postalCode: "5251",
    addressCountry: "AU",
  },
  areaServed: [
    { "@type": "Place", name: "Adelaide Hills, South Australia" },
    { "@type": "Place", name: "Worldwide (online)" },
  ],
  founder: {
    "@type": "Person",
    name: "Levi Hurst",
    jobTitle: "Coach",
    sameAs: ["https://www.instagram.com/loverfighterfitness/"],
  },
  sameAs: ["https://www.instagram.com/loverfighterfitness/"],
  makesOffer: [
    {
      "@type": "Offer",
      name: "Online Coaching",
      price: "80",
      priceCurrency: "AUD",
      description: "Custom training program, nutrition coaching, weekly check-ins, video form reviews and unlimited messaging. Billed weekly, 4-week minimum.",
    },
    {
      "@type": "Offer",
      name: "Comp Prep Coaching",
      price: "120",
      priceCurrency: "AUD",
      description: "Everything in Online Coaching plus federation and class guidance, in-depth nutrition, posing feedback and show-day support. Billed weekly, 4-week minimum.",
    },
  ],
};

const faqPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(f => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

function product(name: string, description: string, price: number, image: string) {
  return {
    "@type": "Product",
    name,
    description,
    image: `${SITE}${image}`,
    brand: { "@type": "Brand", name: "Lover Fighter Fitness" },
    offers: { "@type": "Offer", price: String(price), priceCurrency: "AUD", url: `${SITE}/shop` },
  };
}

const shopProducts = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "LFF Merch",
  itemListElement: [
    product("LFF Drop Shoulder Tee", "Heavyweight drop-shoulder tee in cream, brown or black.", 45, "/shop/tee-brown-front.png"),
    product("LFF Lifting Straps", "Lifting straps built for heavy pulls.", 35, "/shop/straps-flatlay.jpg"),
    product("LFF Wrist Cuffs", "Wrist cuffs for pressing support.", 25, "/shop/cuffs-flatlay.jpg"),
    product("LFF Crew Socks", "Crew socks in cream or brown.", 10, "/shop/socks-brown-hero.jpg"),
  ].map((item, i) => ({ "@type": "ListItem", position: i + 1, item })),
};

function localStructuredData(page: LocalPage): object[] {
  const url = `${SITE}${page.path}`;
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.name,
    serviceType: page.serviceType,
    description: page.description,
    url,
    provider: { "@id": `${SITE}/#business` },
    areaServed: page.areaServed.map(name => ({ "@type": "Place", name })),
    ...(page.offer && {
      offers: {
        "@type": "Offer",
        price: page.offer.price,
        priceCurrency: "AUD",
        description: page.offer.description,
      },
    }),
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map(f => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Lover Fighter Fitness", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: page.name, item: url },
    ],
  };
  return [service, faq, breadcrumbs];
}

function articleStructuredData(a: Article): object[] {
  const url = `${SITE}/learn/${a.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.h1,
      description: a.description,
      datePublished: a.date,
      url,
      mainEntityOfPage: url,
      image: OG_IMAGE,
      author: { "@type": "Person", name: "Levi Hurst", url: SITE, jobTitle: "Coach" },
      publisher: { "@id": `${SITE}/#business` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Lover Fighter Fitness", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Learn", item: `${SITE}/learn` },
        { "@type": "ListItem", position: 3, name: a.h1, item: url },
      ],
    },
  ];
}

const STRUCTURED_DATA: Record<string, object[]> = {
  "": [business, faqPage],
  "/shop": [shopProducts],
  ...Object.fromEntries(localPages.map(p => [p.path, localStructuredData(p)])),
  ...Object.fromEntries(articles.map(a => [`/learn/${a.slug}`, articleStructuredData(a)])),
};

function esc(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const wrap = (inner: string) =>
  `<div style="min-height:100vh;background:#54412F;color:#EAE6D2;font-family:Outfit,system-ui,sans-serif;padding:15vh 24px;line-height:1.6">${inner}</div>`;

const STATIC_CONTENT: Record<string, string> = {
  "": wrap(`
<h1 style="font-family:Montserrat,sans-serif;font-weight:800;margin:0 0 12px">Coaching built for you.</h1>
<p>Personalised strength, bodybuilding and competition prep coaching with Levi Hurst. Custom programming, weekly check-ins, real results. Based in the Adelaide Hills, South Australia, coaching clients world-wide.</p>
<h2>Online Coaching — $80 / week</h2>
<p>Custom training program, workout and nutrition tracking, cookbook access, weekly check-ins, video form reviews, group chats and unlimited message support. 4-week minimum, cancel anytime.</p>
<h2>Comp Prep Coaching — $120 / week</h2>
<p>Everything in Online Coaching, plus an initial consult on classes and federations, in-depth calorie and nutrition coaching, posing feedback, full prep strategy and show-day support.</p>
<h2>Results</h2>
<p>Ruby Frang placed 2nd at her first bodybuilding show (ICN SA) after comp prep with LFF. Kim went from a size XL to a size M in four months.</p>
<h2>Frequently asked questions</h2>
${faqs.map(f => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join("\n")}
<p>${localPages.map(p => `<a href="${p.path}" style="color:#EAE6D2">${esc(p.name)}</a>`).join(" · ")} · <a href="/learn" style="color:#EAE6D2">Learn</a></p>
<p><a href="/shop" style="color:#EAE6D2">LFF Merch</a> · <a href="/program" style="color:#EAE6D2">The Hypertrophy Meta program</a> · <a href="/calculator" style="color:#EAE6D2">Macro calculator</a> · <a href="https://www.instagram.com/loverfighterfitness/" style="color:#EAE6D2">Instagram</a></p>`),
  "/shop": wrap(`
<h1 style="font-family:Montserrat,sans-serif;font-weight:800;margin:0 0 12px">LFF Merch</h1>
<p>Official Lover Fighter Fitness merch: heavyweight drop-shoulder tees ($45), lifting straps ($35), wrist cuffs ($25) and crew socks ($10). Local pickup in Mount Barker, shipping Australia-wide.</p>`),
};

function localStaticContent(page: LocalPage): string {
  const section = (sec: LocalPage["sections"][number]) =>
    [
      `<h2>${esc(sec.heading)}</h2>`,
      ...(sec.paragraphs ?? []).map(t => `<p>${esc(t)}</p>`),
      sec.bullets ? `<ul>${sec.bullets.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : "",
      sec.steps ? `<ol>${sec.steps.map(t => `<li>${esc(t)}</li>`).join("")}</ol>` : "",
    ].join("\n");
  return wrap(`
<p>${esc(page.eyebrow)}</p>
<h1 style="font-family:Montserrat,sans-serif;font-weight:800;margin:0 0 12px">${esc(page.h1)}</h1>
${page.intro.map(t => `<p>${esc(t)}</p>`).join("\n")}
<ul>${page.proof.map(p => `<li><strong>${esc(p.stat)}</strong> ${esc(p.label)}</li>`).join("")}</ul>
${page.sections.map(section).join("\n")}
<h2>Frequently asked questions</h2>
${page.faqs.map(f => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join("\n")}
<p>${page.related.map(path => `<a href="${path}" style="color:#EAE6D2">${esc(localPageByPath[path].name)}</a>`).join(" · ")} · <a href="/" style="color:#EAE6D2">Lover Fighter Fitness</a></p>`);
}

for (const page of localPages) STATIC_CONTENT[page.path] = localStaticContent(page);

function articleStaticContent(a: Article): string {
  const block = (b: Article["body"][number]) => {
    if (b.type === "h2") return `<h2>${esc(b.text)}</h2>`;
    if (b.type === "ul") return `<ul>${b.items.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`;
    return `<p>${esc(b.text)}</p>`;
  };
  return wrap(`
<p><a href="/learn" style="color:#EAE6D2">Learn</a> · ${esc(a.topic)}</p>
<h1 style="font-family:Montserrat,sans-serif;font-weight:800;margin:0 0 12px">${esc(a.h1)}</h1>
<p>By Levi Hurst · ${a.date}</p>
${a.body.map(block).join("\n")}
<p><a href="${a.cta.path}" style="color:#EAE6D2">${esc(a.cta.text)}</a></p>`);
}

for (const a of articles) STATIC_CONTENT[`/learn/${a.slug}`] = articleStaticContent(a);
STATIC_CONTENT[LEARN_INDEX.path] = wrap(`
<h1 style="font-family:Montserrat,sans-serif;font-weight:800;margin:0 0 12px">${esc(LEARN_INDEX.h1)}</h1>
<p>${esc(LEARN_INDEX.intro)}</p>
${articles.map(a => `<h2><a href="/learn/${a.slug}" style="color:#EAE6D2">${esc(a.h1)}</a></h2><p>${esc(a.description)}</p>`).join("\n")}`);

export function seoHead(path: string): string {
  return (STRUCTURED_DATA[path] ?? [])
    .map(d => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`)
    .join("\n    ");
}

export function seoBody(path: string): string {
  return STATIC_CONTENT[path] ?? "";
}
