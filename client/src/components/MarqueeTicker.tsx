/**
 * Marquee Ticker — Scrolling social proof strip
 * Sits between sections as a visual break and trust signal
 */

const items = [
  "⭐ 5.0 Google Rating",
  "16 Verified Reviews",
  "World-Wide Online Coaching",
  "Comp Prep Specialists",
  "Strength & Bodybuilding",
  "Custom Programming",
  "Weekly Check-Ins",
  "Unlimited Support",
  "4+ Years Coaching",
  "Real Results",
];

// Duplicate items so the scroll loops seamlessly
const doubled = [...items, ...items];

export default function MarqueeTicker() {
  return (
    <div
      className="relative overflow-hidden py-4 select-none"
      style={{
        backgroundColor: "rgba(234,230,210,0.07)",
        borderTop: "1px solid rgba(234,230,210,0.12)",
        borderBottom: "1px solid rgba(234,230,210,0.12)",
      }}
    >
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, #54412F, transparent)",
        }}
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, #54412F, transparent)",
        }}
      />

      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 px-8 text-sm font-medium tracking-[0.2em] uppercase whitespace-nowrap"
            style={{ color: "rgba(234,230,210,0.65)" }}
          >
            {item}
            <span
              className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "rgba(234,230,210,0.3)" }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
