/**
 * First-party analytics: ingest endpoint (/api/a) + admin dashboard queries.
 * The table is created on first use, so no drizzle migration is needed.
 * No IPs and no cookies are stored — just a random per-browser id.
 */
import type { Request, Response } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

let tableReady: Promise<void> | null = null;

/** DATETIME values are always written and compared as UTC, whatever the server's timezone. */
const utc = (d: Date) => d.toISOString().slice(0, 23).replace("T", " ");

function ensureTable() {
  if (!tableReady) {
    tableReady = (async () => {
      const db = await getDb();
      if (!db) throw new Error("no database");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          ts DATETIME(3) NOT NULL,
          visitor_id VARCHAR(40) NOT NULL,
          session_id VARCHAR(40) NOT NULL,
          is_new TINYINT(1) NOT NULL DEFAULT 0,
          type VARCHAR(16) NOT NULL,
          name VARCHAR(160) NULL,
          path VARCHAR(191) NOT NULL,
          value INT NULL,
          source VARCHAR(64) NOT NULL,
          referrer VARCHAR(191) NULL,
          utm_source VARCHAR(100) NULL,
          utm_medium VARCHAR(100) NULL,
          utm_campaign VARCHAR(100) NULL,
          device VARCHAR(16) NOT NULL,
          browser VARCHAR(24) NOT NULL,
          os VARCHAR(16) NOT NULL,
          country VARCHAR(2) NULL,
          screen VARCHAR(16) NULL,
          INDEX idx_ts (ts),
          INDEX idx_type_ts (type, ts),
          INDEX idx_session (session_id)
        )
      `);
    })().catch((e) => {
      tableReady = null;
      throw e;
    });
  }
  return tableReady;
}

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python|node-fetch|axios/i;

function parseUA(ua: string) {
  const device = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|iPhone|Android/i.test(ua) ? "mobile" : "desktop";
  const browser = /Instagram/i.test(ua)
    ? "Instagram app"
    : /FBAN|FBAV/i.test(ua)
      ? "Facebook app"
      : /TikTok|musical_ly|BytedanceWebview/i.test(ua)
        ? "TikTok app"
        : /Edg\//.test(ua)
          ? "Edge"
          : /CriOS|Chrome\//.test(ua)
            ? "Chrome"
            : /Firefox|FxiOS/.test(ua)
              ? "Firefox"
              : /Safari\//.test(ua)
                ? "Safari"
                : "Other";
  const os = /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : "Other";
  return { device, browser, os };
}

/** Where the visit came from, in plain words. UTM wins, then in-app browser, then referrer. */
function classifySource(utmSource: string | undefined, browser: string, referrer: string | undefined) {
  if (utmSource) return utmSource.toLowerCase().slice(0, 64);
  if (browser === "Instagram app") return "instagram";
  if (browser === "Facebook app") return "facebook";
  if (browser === "TikTok app") return "tiktok";
  const r = (referrer ?? "").toLowerCase();
  if (!r) return "direct";
  if (r.includes("instagram")) return "instagram";
  if (r.includes("facebook") || r === "fb.me" || r.endsWith("fb.com")) return "facebook";
  if (r.includes("tiktok")) return "tiktok";
  if (r.includes("google.")) return "google";
  if (r.includes("bing.") || r.includes("duckduckgo") || r.includes("yahoo.")) return "other search";
  if (r.includes("linktr.ee") || r.includes("beacons") || r.includes("stan.store")) return "link in bio";
  if (r.includes("stripe.com")) return "stripe";
  return r.replace(/^www\./, "").slice(0, 64);
}

/** Rough country from the browser's timezone — headers carrying the real one don't reach us. */
function countryFromTimezone(tz: string | undefined) {
  if (!tz) return null;
  if (tz.startsWith("Australia/")) return "AU";
  if (tz === "Pacific/Auckland" || tz === "Pacific/Chatham") return "NZ";
  if (tz === "Europe/London") return "GB";
  if (tz.startsWith("America/")) return /Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns/.test(tz) ? "CA" : "US";
  const map: Record<string, string> = {
    "Asia/Singapore": "SG", "Asia/Tokyo": "JP", "Asia/Manila": "PH", "Asia/Kolkata": "IN", "Asia/Dubai": "AE",
    "Asia/Hong_Kong": "HK", "Asia/Jakarta": "ID", "Asia/Bangkok": "TH", "Asia/Kuala_Lumpur": "MY",
    "Europe/Dublin": "IE", "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Amsterdam": "NL", "Europe/Madrid": "ES", "Europe/Rome": "IT",
  };
  return map[tz] ?? null;
}

const str = (max: number) => z.string().max(max).optional();
const payloadSchema = z.object({
  visitor: z.string().min(8).max(40),
  session: z.string().min(8).max(40),
  isNew: z.boolean().optional(),
  referrer: str(191),
  utmSource: str(100),
  utmMedium: str(100),
  utmCampaign: str(100),
  screen: str(16),
  lang: str(20),
  igBrowser: z.boolean().optional(),
  ua: str(300),
  tz: str(64),
  events: z
    .array(
      z.object({
        type: z.enum(["pageview", "click", "scroll", "section", "engage", "conversion"]),
        name: str(160),
        path: z.string().max(191),
        value: z.number().int().min(0).max(86400).optional(),
        ts: z.number(),
      }),
    )
    .min(1)
    .max(50),
});

export async function handleAnalyticsIngest(req: Request, res: Response) {
  // Always answer fast and quietly — analytics must never break the site.
  res.status(204).end();
  try {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
    if (raw.length > 20_000) return;
    const parsed = payloadSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return;
    const p = parsed.data;
    // The Cloudflare Worker in front of www strips request headers, so the page sends its own UA.
    const ua = String(req.headers["user-agent"] ?? p.ua ?? "");
    if (!ua || BOT_UA.test(ua)) return;

    const { device, browser: uaBrowser, os } = parseUA(ua);
    const browser = p.igBrowser ? "Instagram app" : uaBrowser;
    const source = classifySource(p.utmSource, browser, p.referrer);
    const countryHeader = req.headers["cf-ipcountry"];
    const country =
      typeof countryHeader === "string" && /^[A-Z]{2}$/.test(countryHeader)
        ? countryHeader
        : countryFromTimezone(p.tz);
    const now = Date.now();

    await ensureTable();
    const db = await getDb();
    if (!db) return;
    const rows = p.events.map((e) => {
      // Trust the client's clock only within a few minutes of ours.
      const ts = utc(new Date(Math.abs(e.ts - now) < 10 * 60_000 ? e.ts : now));
      return sql`(${ts}, ${p.visitor}, ${p.session}, ${p.isNew ? 1 : 0}, ${e.type}, ${e.name ?? null}, ${e.path}, ${e.value ?? null}, ${source}, ${p.referrer || null}, ${p.utmSource ?? null}, ${p.utmMedium ?? null}, ${p.utmCampaign ?? null}, ${device}, ${browser}, ${os}, ${country}, ${p.screen ?? null})`;
    });
    await db.execute(sql`
      INSERT INTO analytics_events
        (ts, visitor_id, session_id, is_new, type, name, path, value, source, referrer, utm_source, utm_medium, utm_campaign, device, browser, os, country, screen)
      VALUES ${sql.join(rows, sql`, `)}
    `);
  } catch (e) {
    console.warn("[Analytics] ingest failed:", e instanceof Error ? e.message : e);
  }
}

/* ─────────────────────────── Dashboard ─────────────────────────── */

type Row = Record<string, unknown>;

async function rows(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, query: ReturnType<typeof sql>): Promise<Row[]> {
  const result = (await db.execute(query)) as unknown as [Row[]];
  return result[0] ?? [];
}
const n = (v: unknown) => Number(v ?? 0);

/** Minutes Adelaide is ahead of UTC right now (+570 in winter, +630 in summer). */
function adelaideOffsetMinutes() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    timeZoneName: "longOffset",
  }).formatToParts(new Date());
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+10:30";
  const m = tz.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
  if (!m) return 630;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

export const analyticsRouter = router({
  summary: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await ensureTable();
      const since = utc(new Date(Date.now() - input.days * 86_400_000));
      const prevSince = utc(new Date(Date.now() - 2 * input.days * 86_400_000));
      const tz = adelaideOffsetMinutes();

      const [totals] = await rows(db, sql`
        SELECT COUNT(DISTINCT visitor_id) visitors,
               COUNT(DISTINCT session_id) sessions,
               SUM(type = 'pageview') pageviews,
               COUNT(DISTINCT CASE WHEN is_new = 1 THEN visitor_id END) new_visitors
        FROM analytics_events WHERE ts >= ${since}`);
      const [prev] = await rows(db, sql`
        SELECT COUNT(DISTINCT visitor_id) visitors, COUNT(DISTINCT session_id) sessions
        FROM analytics_events WHERE ts >= ${prevSince} AND ts < ${since}`);
      const [engage] = await rows(db, sql`
        SELECT COALESCE(SUM(value), 0) secs FROM analytics_events WHERE type = 'engage' AND ts >= ${since}`);
      const [bounce] = await rows(db, sql`
        SELECT COUNT(*) total, SUM(pv = 1 AND clicks = 0) bounced FROM (
          SELECT session_id, SUM(type = 'pageview') pv, SUM(type IN ('click','conversion')) clicks
          FROM analytics_events WHERE ts >= ${since} GROUP BY session_id) s`);

      const daily = await rows(db, sql`
        SELECT DATE_FORMAT(DATE_ADD(ts, INTERVAL ${tz} MINUTE), '%Y-%m-%d') d,
               COUNT(DISTINCT visitor_id) visitors, SUM(type = 'pageview') pageviews
        FROM analytics_events WHERE ts >= ${since}
        GROUP BY d ORDER BY d`);

      const pages = await rows(db, sql`
        SELECT path, SUM(type = 'pageview') views, COUNT(DISTINCT CASE WHEN type = 'pageview' THEN visitor_id END) visitors,
               ROUND(SUM(CASE WHEN type = 'engage' THEN value ELSE 0 END) / NULLIF(COUNT(DISTINCT session_id), 0)) avg_secs
        FROM analytics_events WHERE ts >= ${since}
        GROUP BY path HAVING views > 0 ORDER BY views DESC LIMIT 15`);

      const sources = await rows(db, sql`
        SELECT source, COUNT(DISTINCT session_id) sessions, COUNT(DISTINCT visitor_id) visitors
        FROM analytics_events WHERE ts >= ${since}
        GROUP BY source ORDER BY sessions DESC LIMIT 12`);
      const campaigns = await rows(db, sql`
        SELECT utm_source, utm_medium, utm_campaign, COUNT(DISTINCT session_id) sessions
        FROM analytics_events WHERE ts >= ${since} AND utm_campaign IS NOT NULL
        GROUP BY utm_source, utm_medium, utm_campaign ORDER BY sessions DESC LIMIT 10`);
      const referrers = await rows(db, sql`
        SELECT referrer, COUNT(DISTINCT session_id) sessions
        FROM analytics_events WHERE ts >= ${since} AND referrer IS NOT NULL
        GROUP BY referrer ORDER BY sessions DESC LIMIT 10`);

      const devices = await rows(db, sql`
        SELECT device label, COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE ts >= ${since} GROUP BY device ORDER BY sessions DESC`);
      const browsers = await rows(db, sql`
        SELECT browser label, COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE ts >= ${since} GROUP BY browser ORDER BY sessions DESC LIMIT 8`);
      const countries = await rows(db, sql`
        SELECT COALESCE(country, '??') label, COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE ts >= ${since} GROUP BY country ORDER BY sessions DESC LIMIT 10`);

      const clicks = await rows(db, sql`
        SELECT name, path, COUNT(*) clicks, COUNT(DISTINCT session_id) sessions
        FROM analytics_events WHERE ts >= ${since} AND type = 'click'
        GROUP BY name, path ORDER BY clicks DESC LIMIT 25`);
      const conversions = await rows(db, sql`
        SELECT name, COUNT(*) total, COUNT(DISTINCT session_id) sessions
        FROM analytics_events WHERE ts >= ${since} AND type = 'conversion'
        GROUP BY name ORDER BY total DESC`);

      const scroll = await rows(db, sql`
        SELECT path, value mark, COUNT(DISTINCT session_id) sessions
        FROM analytics_events WHERE ts >= ${since} AND type = 'scroll' AND path IN ('/', '/shop', '/program')
        GROUP BY path, value`);
      const sections = await rows(db, sql`
        SELECT path, name, COUNT(DISTINCT session_id) sessions
        FROM analytics_events WHERE ts >= ${since} AND type = 'section' AND path IN ('/', '/shop')
        GROUP BY path, name ORDER BY path, sessions DESC`);
      const pathSessions = await rows(db, sql`
        SELECT path, COUNT(DISTINCT session_id) sessions
        FROM analytics_events WHERE ts >= ${since} AND type = 'pageview' GROUP BY path`);

      // Funnels, counted in sessions
      const [coaching] = await rows(db, sql`
        SELECT
          COUNT(DISTINCT CASE WHEN type = 'pageview' AND path = '/' THEN session_id END) landed,
          COUNT(DISTINCT CASE WHEN type = 'section' AND path = '/' AND name = 'coaching' THEN session_id END) saw_pricing,
          COUNT(DISTINCT CASE WHEN type = 'conversion' AND name LIKE 'checkout_started:%Coaching' THEN session_id END) started_checkout,
          COUNT(DISTINCT CASE WHEN type = 'conversion' AND name = 'lead_submitted' THEN session_id END) enquired,
          COUNT(DISTINCT CASE WHEN type = 'conversion' AND name LIKE 'coaching_purchase%' THEN session_id END) purchased
        FROM analytics_events WHERE ts >= ${since}`);
      const [shop] = await rows(db, sql`
        SELECT
          COUNT(DISTINCT CASE WHEN type = 'pageview' AND path = '/shop' THEN session_id END) landed,
          COUNT(DISTINCT CASE WHEN type = 'conversion' AND name LIKE 'add_to_cart:%' THEN session_id END) added,
          COUNT(DISTINCT CASE WHEN type = 'conversion' AND name = 'checkout_started' THEN session_id END) started_checkout,
          COUNT(DISTINCT CASE WHEN type = 'conversion' AND name = 'shop_purchase' THEN session_id END) purchased
        FROM analytics_events WHERE ts >= ${since}`);

      // Real money, straight from Stripe-fed order records
      let orders: Row = { orders: 0, revenue: 0 };
      try {
        [orders] = await rows(db, sql`
          SELECT COUNT(*) orders, COALESCE(SUM(total), 0) revenue FROM shop_orders WHERE createdAt >= ${since}`);
      } catch { /* table missing locally */ }

      const recent = await rows(db, sql`
        SELECT DATE_FORMAT(ts, '%Y-%m-%dT%H:%i:%sZ') ts, name, path, source, device, browser, country
        FROM analytics_events WHERE ts >= ${since} AND type = 'conversion'
        ORDER BY ts DESC LIMIT 20`);

      const sessions = n(totals?.sessions);
      return {
        days: input.days,
        totals: {
          visitors: n(totals?.visitors),
          newVisitors: n(totals?.new_visitors),
          sessions,
          pageviews: n(totals?.pageviews),
          prevVisitors: n(prev?.visitors),
          prevSessions: n(prev?.sessions),
          avgEngagedSecs: sessions ? Math.round(n(engage?.secs) / sessions) : 0,
          bounceRate: n(bounce?.total) ? n(bounce?.bounced) / n(bounce?.total) : 0,
          orders: n(orders.orders),
          revenueCents: n(orders.revenue),
        },
        daily: daily.map((r) => ({ date: String(r.d).slice(0, 10), visitors: n(r.visitors), pageviews: n(r.pageviews) })),
        pages: pages.map((r) => ({ path: String(r.path), views: n(r.views), visitors: n(r.visitors), avgSecs: n(r.avg_secs) })),
        sources: sources.map((r) => ({ source: String(r.source), sessions: n(r.sessions), visitors: n(r.visitors) })),
        campaigns: campaigns.map((r) => ({ source: String(r.utm_source ?? ""), medium: String(r.utm_medium ?? ""), campaign: String(r.utm_campaign ?? ""), sessions: n(r.sessions) })),
        referrers: referrers.map((r) => ({ referrer: String(r.referrer), sessions: n(r.sessions) })),
        devices: devices.map((r) => ({ label: String(r.label), sessions: n(r.sessions) })),
        browsers: browsers.map((r) => ({ label: String(r.label), sessions: n(r.sessions) })),
        countries: countries.map((r) => ({ label: String(r.label), sessions: n(r.sessions) })),
        clicks: clicks.map((r) => ({ name: String(r.name ?? ""), path: String(r.path), clicks: n(r.clicks), sessions: n(r.sessions) })),
        conversions: conversions.map((r) => ({ name: String(r.name ?? ""), total: n(r.total), sessions: n(r.sessions) })),
        scroll: scroll.map((r) => ({ path: String(r.path), mark: n(r.mark), sessions: n(r.sessions) })),
        sections: sections.map((r) => ({ path: String(r.path), name: String(r.name ?? ""), sessions: n(r.sessions) })),
        pathSessions: pathSessions.map((r) => ({ path: String(r.path), sessions: n(r.sessions) })),
        funnels: {
          coaching: {
            landed: n(coaching?.landed),
            sawPricing: n(coaching?.saw_pricing),
            startedCheckout: n(coaching?.started_checkout),
            enquired: n(coaching?.enquired),
            purchased: n(coaching?.purchased),
          },
          shop: {
            landed: n(shop?.landed),
            added: n(shop?.added),
            startedCheckout: n(shop?.started_checkout),
            purchased: n(shop?.purchased),
          },
        },
        recent: recent.map((r) => ({
          ts: String(r.ts),
          name: String(r.name ?? ""),
          path: String(r.path),
          source: String(r.source),
          device: String(r.device),
          browser: String(r.browser),
          country: r.country ? String(r.country) : null,
        })),
      };
    }),
});
