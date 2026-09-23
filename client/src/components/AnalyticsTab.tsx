/**
 * Analytics Tab — first-party site analytics (see server/analytics.ts).
 * Everything is counted in sessions unless it says otherwise.
 */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const CREAM = "#EAE6D2";
const BROWN = "#54412F";
const card = "rounded-2xl p-5";
const cardStyle = { backgroundColor: "rgba(234,230,210,0.07)", border: "1px solid rgba(234,230,210,0.14)" };
const muted = { color: "rgba(234,230,210,0.72)" };

const nf = new Intl.NumberFormat("en-AU");
const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const fmtSecs = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

const CONVERSION_LABELS: Record<string, string> = {
  lead_submitted: "Contact form sent",
  calculator_submitted: "Macro calculator used",
  checkout_started: "Shop checkout started",
  shop_purchase: "Shop purchase",
  program_checkout: "Program checkout started",
  program_purchase: "Program purchase",
  "checkout_started:standardCoaching": "Online Coaching checkout started",
  "checkout_started:compPrepCoaching": "Comp Prep checkout started",
  "coaching_purchase:standardCoaching": "Online Coaching purchase",
  "coaching_purchase:compPrepCoaching": "Comp Prep purchase",
};
const conversionLabel = (name: string) =>
  CONVERSION_LABELS[name] ?? (name.startsWith("add_to_cart:") ? `Added to cart: ${name.slice(12)}` : name);

function Heading({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: CREAM }}>{children}</h3>
      {note && <p className="text-xs mt-1" style={muted}>{note}</p>}
    </div>
  );
}

function BarList({ items, total, empty = "No data yet" }: { items: { label: string; value: number; sub?: string }[]; total?: number; empty?: string }) {
  if (!items.length) return <p className="text-sm" style={muted}>{empty}</p>;
  const max = total ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="relative rounded-lg overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${Math.max(2, (i.value / max) * 100)}%`, backgroundColor: "rgba(234,230,210,0.13)" }} />
          <div className="relative flex items-center justify-between gap-3 px-3 py-2 text-sm" style={{ color: CREAM }}>
            <span className="truncate min-w-0">{i.label}</span>
            <span className="tabular-nums shrink-0 font-semibold">
              {nf.format(i.value)}
              {i.sub && <span className="font-normal ml-2" style={muted}>{i.sub}</span>}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = steps[0]?.value || 0;
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.label}>
          <div className="flex justify-between text-sm mb-1" style={{ color: CREAM }}>
            <span>{s.label}</span>
            <span className="tabular-nums">
              <b>{nf.format(s.value)}</b>
              <span className="ml-2" style={muted}>{i === 0 ? "sessions" : `${pct(s.value, top)} of start`}</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full" style={{ backgroundColor: "rgba(234,230,210,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: `${top ? Math.max(1.5, (s.value / top) * 100) : 0}%`, backgroundColor: CREAM }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function DailyChart({ data }: { data: { date: string; visitors: number; pageviews: number }[] }) {
  if (!data.some((d) => d.visitors > 0)) return <p className="text-sm" style={muted}>No visits recorded yet — data appears as soon as people browse the site.</p>;
  const max = Math.max(...data.map((d) => d.visitors), 1);
  const W = 720, H = 180, pad = 24;
  const bw = (W - pad) / data.length;
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full min-w-[480px]" role="img" aria-label="Daily visitors">
        {[0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad} x2={W} y1={H - f * (H - 12)} y2={H - f * (H - 12)} stroke="rgba(234,230,210,0.12)" />
            <text x={0} y={H - f * (H - 12) + 4} fontSize="10" fill="rgba(234,230,210,0.7)">{Math.round(max * f)}</text>
          </g>
        ))}
        <line x1={pad} x2={W} y1={H} y2={H} stroke="rgba(234,230,210,0.25)" />
        {data.map((d, i) => {
          const h = (d.visitors / max) * (H - 12);
          return (
            <g key={d.date}>
              {d.visitors > 0 && (
                <rect x={pad + i * bw + bw * 0.15} y={H - h} width={bw * 0.7} height={h} rx={Math.min(3, bw * 0.3)} fill={CREAM}>
                  <title>{`${fmt(d.date)}: ${d.visitors} visitors, ${d.pageviews} page views`}</title>
                </rect>
              )}
              {(i === 0 || i === data.length - 1 || (i % Math.ceil(data.length / 7) === 0 && data.length - i > data.length / 10)) && (
                <text
                  x={i === data.length - 1 ? W : i === 0 ? pad : pad + i * bw + bw / 2}
                  y={H + 16}
                  fontSize="10"
                  textAnchor={i === data.length - 1 ? "end" : i === 0 ? "start" : "middle"}
                  fill="rgba(234,230,210,0.7)"
                >
                  {fmt(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Delta({ now, prev }: { now: number; prev: number }) {
  if (!prev) return null;
  const change = Math.round(((now - prev) / prev) * 100);
  return (
    <span className="text-xs font-semibold ml-2" style={{ color: change >= 0 ? "#CFE3C4" : "#F2B8A0" }}>
      {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
    </span>
  );
}

export default function AnalyticsTab() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = trpc.analytics.summary.useQuery({ days }, { refetchInterval: 60_000 });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={28} style={{ color: CREAM }} /></div>;
  }
  if (error || !data) {
    return <p className="text-sm py-10 text-center" style={muted}>Couldn't load analytics: {error?.message ?? "unknown error"}</p>;
  }

  const t = data.totals;
  const sessionsFor = (path: string) => data.pathSessions.find((p) => p.path === path)?.sessions ?? 0;
  const homeSessions = sessionsFor("/");
  const shopSessions = sessionsFor("/shop");

  return (
    <div className="space-y-5" style={{ color: CREAM }}>
      {/* Range */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={muted}>Your own visits are excluded once you've logged in here. Updates every minute.</p>
        <div className="flex gap-1 rounded-full p-1" style={{ backgroundColor: "rgba(234,230,210,0.08)" }}>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="text-xs font-bold px-4 py-1.5 rounded-full"
              style={{ backgroundColor: days === d ? CREAM : "transparent", color: days === d ? BROWN : CREAM }}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Visitors", value: nf.format(t.visitors), extra: <Delta now={t.visitors} prev={t.prevVisitors} />, sub: `${nf.format(t.newVisitors)} new` },
          { label: "Visits", value: nf.format(t.sessions), extra: <Delta now={t.sessions} prev={t.prevSessions} />, sub: `${nf.format(t.pageviews)} page views` },
          { label: "Avg time on site", value: fmtSecs(t.avgEngagedSecs), sub: "actively viewing" },
          { label: "Bounce rate", value: t.sessions ? `${Math.round(t.bounceRate * 100)}%` : "—", sub: "1 page, no clicks" },
          { label: "Shop orders", value: nf.format(t.orders), sub: "from Stripe" },
          { label: "Shop revenue", value: money.format(t.revenueCents / 100), sub: "from Stripe" },
        ].map((k) => (
          <div key={k.label} className={card} style={cardStyle}>
            <p className="text-[11px] tracking-[0.15em] uppercase font-semibold" style={muted}>{k.label}</p>
            <p className="text-2xl font-black mt-1 tabular-nums">{k.value}{k.extra}</p>
            <p className="text-xs mt-1" style={muted}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className={card} style={cardStyle}>
        <Heading>Visitors per day</Heading>
        <DailyChart data={data.daily} />
      </div>

      {/* Funnels */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className={card} style={cardStyle}>
          <Heading note="Sessions that landed on the homepage and how far they got.">Coaching funnel</Heading>
          <Funnel
            steps={[
              { label: "Landed on homepage", value: data.funnels.coaching.landed },
              { label: "Scrolled to pricing", value: data.funnels.coaching.sawPricing },
              { label: "Started coaching checkout", value: data.funnels.coaching.startedCheckout },
              { label: "Sent the contact form", value: data.funnels.coaching.enquired },
              { label: "Paid for coaching", value: data.funnels.coaching.purchased },
            ]}
          />
        </div>
        <div className={card} style={cardStyle}>
          <Heading note="Instagram payment-link buyers skip the cart, so check Orders for the full count.">Shop funnel</Heading>
          <Funnel
            steps={[
              { label: "Visited the shop", value: data.funnels.shop.landed },
              { label: "Added to cart", value: data.funnels.shop.added },
              { label: "Started checkout", value: data.funnels.shop.startedCheckout },
              { label: "Came back paid", value: data.funnels.shop.purchased },
            ]}
          />
        </div>
      </div>

      {/* Sources */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className={card} style={cardStyle}>
          <Heading note="Instagram's in-app browser counts as Instagram even when it hides the referrer.">Where visits come from</Heading>
          <BarList items={data.sources.map((s) => ({ label: s.source, value: s.sessions, sub: `${nf.format(s.visitors)} people` }))} />
        </div>
        <div className={card} style={cardStyle}>
          <Heading note="Add ?utm_source=instagram&utm_campaign=bio to your bio link (or story links) to see them here.">Campaigns (UTM)</Heading>
          <BarList
            items={data.campaigns.map((c) => ({ label: [c.campaign, c.source, c.medium].filter(Boolean).join(" · "), value: c.sessions }))}
            empty="No tagged links yet."
          />
          {data.referrers.length > 0 && (
            <>
              <div className="h-4" />
              <Heading>Referring sites</Heading>
              <BarList items={data.referrers.map((r) => ({ label: r.referrer, value: r.sessions }))} />
            </>
          )}
        </div>
      </div>

      {/* Conversions */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className={card} style={cardStyle}>
          <Heading>Key actions</Heading>
          <BarList items={data.conversions.map((c) => ({ label: conversionLabel(c.name), value: c.total }))} empty="No enquiries, checkouts or carts yet." />
        </div>
        <div className={card} style={cardStyle}>
          <Heading>Latest actions</Heading>
          {data.recent.length ? (
            <ul className="divide-y" style={{ borderColor: "rgba(234,230,210,0.1)" }}>
              {data.recent.map((r, i) => (
                <li key={i} className="py-2 text-sm flex justify-between gap-3" style={{ borderColor: "rgba(234,230,210,0.1)" }}>
                  <span className="min-w-0 truncate">{conversionLabel(r.name)}</span>
                  <span className="shrink-0 text-xs text-right" style={muted}>
                    {r.source} · {r.device}{r.country ? ` · ${r.country}` : ""}
                    <br />
                    {new Date(r.ts).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Australia/Adelaide" })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={muted}>Nothing yet.</p>
          )}
        </div>
      </div>

      {/* Pages + clicks */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className={card} style={cardStyle}>
          <Heading note="Views · average active time per visit">Top pages</Heading>
          <BarList items={data.pages.map((p) => ({ label: p.path, value: p.views, sub: fmtSecs(p.avgSecs) }))} />
        </div>
        <div className={card} style={cardStyle}>
          <Heading note="Every button and link, named by its text.">Most-clicked</Heading>
          <BarList items={data.clicks.slice(0, 15).map((c) => ({ label: `${c.name}${c.path !== "/" ? `  (${c.path})` : ""}`, value: c.clicks }))} />
        </div>
      </div>

      {/* Section reach + scroll */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className={card} style={cardStyle}>
          <Heading note="Share of homepage visits that reached each section. Where it drops is where people leave.">Homepage: how far people get</Heading>
          <BarList
            total={homeSessions || undefined}
            items={data.sections.filter((s) => s.path === "/").map((s) => ({ label: s.name, value: s.sessions, sub: pct(s.sessions, homeSessions) }))}
          />
        </div>
        <div className={card} style={cardStyle}>
          <Heading note="Share of shop visits that reached each section.">Shop: how far people get</Heading>
          <BarList
            total={shopSessions || undefined}
            items={data.sections.filter((s) => s.path === "/shop").map((s) => ({ label: s.name, value: s.sessions, sub: pct(s.sessions, shopSessions) }))}
          />
          <div className="h-4" />
          <Heading>Scroll depth</Heading>
          <BarList
            items={["/", "/shop", "/program"].flatMap((path) =>
              data.scroll
                .filter((s) => s.path === path)
                .sort((a, b) => a.mark - b.mark)
                .map((s) => ({ label: `${path} · ${s.mark}%`, value: s.sessions, sub: pct(s.sessions, sessionsFor(path)) })),
            )}
          />
        </div>
      </div>

      {/* Audience */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className={card} style={cardStyle}><Heading>Devices</Heading><BarList items={data.devices.map((d) => ({ label: d.label, value: d.sessions }))} /></div>
        <div className={card} style={cardStyle}><Heading>Browsers</Heading><BarList items={data.browsers.map((d) => ({ label: d.label, value: d.sessions }))} /></div>
        <div className={card} style={cardStyle}><Heading>Countries</Heading><BarList items={data.countries.map((d) => ({ label: d.label, value: d.sessions }))} /></div>
      </div>
    </div>
  );
}
