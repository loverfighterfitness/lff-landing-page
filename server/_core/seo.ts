import { faqs } from "@shared/faqs";

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
const KNOWN_PATHS = new Set(["", "/calculator", "/admin", "/admin/leads", "/shop", "/program", "/game", "/success", "/404"]);
const NOINDEX_PATHS = new Set(["/admin", "/admin/leads", "/success", "/404"]);

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

const STRUCTURED_DATA: Record<string, object[]> = {
  "": [business, faqPage],
  "/shop": [shopProducts],
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
<p><a href="/shop" style="color:#EAE6D2">LFF Merch</a> · <a href="/program" style="color:#EAE6D2">The Hypertrophy Meta program</a> · <a href="/calculator" style="color:#EAE6D2">Macro calculator</a> · <a href="https://www.instagram.com/loverfighterfitness/" style="color:#EAE6D2">Instagram</a></p>`),
  "/shop": wrap(`
<h1 style="font-family:Montserrat,sans-serif;font-weight:800;margin:0 0 12px">LFF Merch</h1>
<p>Official Lover Fighter Fitness merch: heavyweight drop-shoulder tees ($45), lifting straps ($35), wrist cuffs ($25) and crew socks ($10). Local pickup in Mount Barker, shipping Australia-wide.</p>`),
};

export function seoHead(path: string): string {
  return (STRUCTURED_DATA[path] ?? [])
    .map(d => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`)
    .join("\n    ");
}

export function seoBody(path: string): string {
  return STATIC_CONTENT[path] ?? "";
}
