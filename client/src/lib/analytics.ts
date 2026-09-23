/**
 * First-party analytics — no cookies, no third parties.
 * Events are batched and sent to /api/a with sendBeacon, stored in our own DB,
 * and read back on /admin/leads → Analytics.
 *
 * Tracked automatically: page views, every link/button click, scroll depth,
 * which homepage/shop sections were seen, engaged time, UTM + referrer,
 * and Stripe purchase returns. Call track() for anything else.
 */
import { getAdminKey } from "./adminKey";

type EventType = "pageview" | "click" | "scroll" | "section" | "engage" | "conversion";

type QueuedEvent = {
  type: EventType;
  name?: string;
  path: string;
  value?: number;
  ts: number;
};

const ENDPOINT = "/api/a";
const SESSION_IDLE_MS = 30 * 60 * 1000;

let started = false;
let queue: QueuedEvent[] = [];
let context: Record<string, string | boolean | undefined> = {};
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// Per-page state
let currentPath = "";
let scrollMarks = new Set<number>();
let seenSections = new Set<string>();
let sectionObserver: IntersectionObserver | null = null;
let engagedMs = 0;
let visibleSince = 0;

function safeGet(store: Storage, key: string) {
  try { return store.getItem(key); } catch { return null; }
}
function safeSet(store: Storage, key: string, value: string) {
  try { store.setItem(key, value); } catch { /* storage blocked */ }
}
function uuid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function isExcluded(path: string) {
  // Don't track the admin area, or Levi's own browsing once he's logged into admin.
  return path.startsWith("/admin") || !!getAdminKey();
}

function ids() {
  let visitor = safeGet(localStorage, "lff-vid");
  let isNew = false;
  if (!visitor) {
    visitor = uuid();
    isNew = true;
    safeSet(localStorage, "lff-vid", visitor);
  }
  const now = Date.now();
  let session = safeGet(sessionStorage, "lff-sid");
  const last = Number(safeGet(sessionStorage, "lff-slast") ?? 0);
  if (!session || now - last > SESSION_IDLE_MS) {
    session = uuid();
    safeSet(sessionStorage, "lff-sid", session);
  }
  safeSet(sessionStorage, "lff-slast", String(now));
  return { visitor, session, isNew };
}

function landingContext() {
  const params = new URLSearchParams(window.location.search);
  // First-touch UTM + referrer are kept for the whole session.
  const stored = safeGet(sessionStorage, "lff-landing");
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  let referrer = "";
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.host !== window.location.host) referrer = ref.host;
  } catch { /* bad referrer */ }
  const landing = {
    referrer,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
  safeSet(sessionStorage, "lff-landing", JSON.stringify(landing));
  return landing;
}

function enqueue(type: EventType, name?: string, value?: number, flushNow = false) {
  if (!started || isExcluded(currentPath || window.location.pathname)) return;
  queue.push({
    type,
    name: name?.slice(0, 160),
    path: currentPath || window.location.pathname,
    value: value === undefined ? undefined : Math.round(value),
    ts: Date.now(),
  });
  if (flushNow || queue.length >= 20) flush();
  else if (!flushTimer) flushTimer = setTimeout(flush, 4000);
}

export function flush() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!queue.length) return;
  const { visitor, session, isNew } = ids();
  const body = JSON.stringify({ ...context, visitor, session, isNew, events: queue });
  queue = [];
  try {
    const blob = new Blob([body], { type: "text/plain" });
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
  } catch { /* fall back to fetch */ }
  fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
}

/** Record a named conversion (lead_submitted, add_to_cart, checkout_started…). */
export function track(name: string, value?: number) {
  enqueue("conversion", name, value, true);
}

/* ─── Engagement time (only while the tab is visible) ─── */
function pauseEngagement() {
  if (visibleSince) engagedMs += Date.now() - visibleSince;
  visibleSince = 0;
}
function sendEngagement() {
  pauseEngagement();
  if (engagedMs >= 1000) enqueue("engage", undefined, engagedMs / 1000);
  engagedMs = 0;
}

/* ─── Scroll depth ─── */
function onScroll() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  if (max <= 0) return;
  const pct = (window.scrollY / max) * 100;
  for (const mark of [25, 50, 75, 100]) {
    if (pct >= mark - 1 && !scrollMarks.has(mark)) {
      scrollMarks.add(mark);
      enqueue("scroll", undefined, mark);
    }
  }
}

/* ─── Section reach ─── */
function sectionName(el: Element) {
  const heading = el.querySelector<HTMLElement>("h1, h2");
  const text = (heading?.innerText || heading?.textContent)?.replace(/\s+/g, " ").trim();
  return el.id || text?.slice(0, 60) || "";
}
function observeSections() {
  sectionObserver?.disconnect();
  if (!("IntersectionObserver" in window)) return;
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const name = sectionName(entry.target);
        if (name && !seenSections.has(name)) {
          seenSections.add(name);
          enqueue("section", name);
        }
      }
    },
    { threshold: 0.35 },
  );
  // Sections mount lazily — observe after the page has rendered.
  setTimeout(() => {
    document.querySelectorAll("section").forEach((s) => {
      if (sectionName(s)) sectionObserver?.observe(s);
    });
  }, 1200);
}

/* ─── Clicks: every link and button, named by data-track, aria-label or text ─── */
function onClick(e: MouseEvent) {
  const target = (e.target as Element | null)?.closest?.("a, button, [role='button'], [data-track]");
  if (!target) return;
  const label =
    target.getAttribute("data-track") ||
    target.getAttribute("aria-label") ||
    target.textContent?.replace(/\s+/g, " ").trim() ||
    "";
  const href = target instanceof HTMLAnchorElement ? target.getAttribute("href") ?? "" : "";
  const name = [label.slice(0, 80), href && !href.startsWith("#") ? `→ ${href.slice(0, 70)}` : href]
    .filter(Boolean)
    .join(" ");
  if (!name) return;
  // Links that leave the site (Stripe, Instagram) must be sent before unload.
  const leaving = target instanceof HTMLAnchorElement && target.host && target.host !== window.location.host;
  enqueue("click", name, undefined, !!leaving);
}

/** Call on every route change (and once at start). */
export function pageview(path = window.location.pathname) {
  if (!started) return;
  if (currentPath && currentPath !== path) sendEngagement();
  currentPath = path;
  scrollMarks = new Set();
  seenSections = new Set();
  engagedMs = 0;
  visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
  enqueue("pageview");
  observeSections();
}

function purchaseReturns() {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  if (path === "/success") track(`coaching_purchase${params.get("package") ? `:${params.get("package")}` : ""}`);
  if (params.get("checkout") === "success" && path === "/shop") track("shop_purchase");
  if (params.get("checkout") === "success" && path === "/program") track("program_purchase");
}

export function initAnalytics() {
  if (started || typeof window === "undefined") return;
  if (navigator.webdriver) return; // headless browsers / bots
  started = true;
  const ua = navigator.userAgent;
  context = {
    ...landingContext(),
    screen: `${window.screen.width}x${window.screen.height}`,
    lang: navigator.language,
    igBrowser: /Instagram/i.test(ua) || undefined,
    // Sent in the body: the Cloudflare Worker in front of the site strips request headers.
    ua: ua.slice(0, 300),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  pageview();
  purchaseReturns();

  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sendEngagement();
      flush();
    } else {
      visibleSince = Date.now();
    }
  });
  window.addEventListener("pagehide", () => { sendEngagement(); flush(); });
}
