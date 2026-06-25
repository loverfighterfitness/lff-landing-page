/**
 * /program — The Hypertrophy Meta
 * Standalone, simpler sibling of the coaching landing page. Sells the
 * downloadable PDF program via Stripe Checkout; delivery is emailed by the
 * webhook. Soft fallback CTA into coaching at the bottom.
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const BROWN = "#54412F";
const CREAM = "#EAE6D2";
const PAPER = "#F4F1E6";
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontStyle: "italic",
  fontWeight: 600,
};
const display: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif", fontWeight: 800 };
const body: React.CSSProperties = { fontFamily: "'Outfit', system-ui, sans-serif" };

const PHOTOS = [
  { src: "/program/backstage.jpg", alt: "Levi coaching backstage at a competition" },
  { src: "/program/dom.jpg", alt: "LFF client Dom mid-session" },
  { src: "/program/benny.jpg", alt: "LFF client Benny training" },
];

const PILLARS = [
  { n: "01", t: "Stable", d: "Locked in and balanced, so you can drive the target muscle instead of fighting to stay steady — and push genuinely close to failure, safely." },
  { n: "02", t: "Easy to execute", d: "Low skill, low coordination. You're here to load a muscle, not master a trick. Effort goes into the muscle, not the technique." },
  { n: "03", t: "Comfortable", d: "Fits your body and leverages with no joint pain. Comfort is what lets you train hard, session after session, without breaking down." },
  { n: "04", t: "Isolated", d: "Biases the muscle you're targeting with minimal interference — a better stimulus-to-fatigue ratio, more growth for less cost." },
];

const FAQ = [
  { q: "What exactly do I get?", a: "A polished PDF — four full sessions (Upper/Lower run twice), every exercise with sets, reps, rest and swap options, plus the four pillars and the exact progression model. Yours forever." },
  { q: "Is it a one-off payment?", a: "Yes. Pay once, download, keep it for life. No subscription." },
  { q: "What level is it for?", a: "Beginner through early-intermediate gets the most from it, but the double-progression model scales with you as you get stronger." },
  { q: "How do I get it after paying?", a: "A private download link lands in your email inbox the moment payment clears. Save the PDF somewhere safe and you're set." },
];

export default function Program() {
  const [purchased, setPurchased] = useState(false);
  const checkout = trpc.stripe.createProgramCheckout.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") setPurchased(true);
  }, []);

  const buy = async () => {
    try {
      const res = await checkout.mutateAsync();
      if (res?.url) window.location.href = res.url;
    } catch {
      alert("Couldn't start checkout — please try again, or email loverfighterfitness@gmail.com");
    }
  };

  const BuyButton = ({ label = "Get the program" }: { label?: string }) => (
    <button
      onClick={buy}
      disabled={checkout.isPending}
      style={{ ...body, background: CREAM, color: BROWN }}
      className="inline-block px-9 py-4 rounded-full font-bold tracking-widest uppercase text-sm shadow-lg disabled:opacity-60 transition hover:opacity-90"
    >
      {checkout.isPending ? "One sec…" : label}
    </button>
  );

  return (
    <div style={{ ...body, background: BROWN }} className="min-h-screen w-full overflow-x-hidden">
      {purchased && (
        <div style={{ background: CREAM, color: BROWN }} className="w-full text-center py-3 px-4 text-sm font-semibold">
          Payment received — your download link is on its way to your email. Check spam if it's not there in a minute.
        </div>
      )}

      {/* HERO */}
      <header className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center">
        <img src="/program/lff-mono.png" alt="Lover Fighter Fitness" className="h-16 w-auto mx-auto mb-9" />
        <p style={{ color: "rgba(234,230,210,0.6)" }} className="text-[11px] tracking-[0.3em] uppercase mb-6">
          Lover Fighter Fitness · Training Systems
        </p>
        <h1 style={{ ...display, color: CREAM }} className="uppercase leading-[0.9] text-5xl sm:text-6xl">
          The<br />Hypertrophy
        </h1>
        <p style={{ ...serif, color: CREAM }} className="text-5xl sm:text-6xl leading-none mt-1 mb-7">Meta.</p>
        <p style={{ color: "rgba(234,230,210,0.82)" }} className="text-lg leading-relaxed max-w-xl mx-auto font-light">
          The current <span style={{ color: CREAM, fontWeight: 600 }}>meta</span> for building muscle — an
          upper/lower split run twice, every exercise chosen through the four pillars of hypertrophy, and
          progressed every single week.
        </p>

        {/* photo row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-10">
          {PHOTOS.map((p) => (
            <div key={p.src} className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(234,230,210,0.5)", aspectRatio: "3 / 4" }}>
              <img src={p.src} alt={p.alt} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* price + cta */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex items-end gap-3" style={{ color: CREAM }}>
            <span style={{ ...display }} className="text-4xl">$60</span>
            <span style={{ color: "rgba(234,230,210,0.55)" }} className="text-sm mb-1 uppercase tracking-widest">AUD · one-off</span>
          </div>
          <p style={{ color: "#E9C9A0" }} className="text-xs uppercase tracking-[0.2em]">
            Founders launch — first 5 at half price ($30) with code <b>GROW</b>
          </p>
          <div className="mt-2"><BuyButton /></div>
          <p style={{ color: "rgba(234,230,210,0.5)" }} className="text-xs mt-1">Instant email delivery · yours forever</p>
        </div>
      </header>

      {/* FOUR PILLARS */}
      <section style={{ background: PAPER, color: BROWN }} className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: "#6B5640" }}>The philosophy</p>
          <h2 style={{ ...display }} className="uppercase text-3xl sm:text-4xl leading-tight mb-2">
            The four pillars <span style={{ ...serif, textTransform: "none" }}>of hypertrophy</span>
          </h2>
          <p className="text-base leading-relaxed mb-8 max-w-xl" style={{ color: "#5b4a38" }}>
            Every exercise in the program earns its place against four tests — the lens I select movements through.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {PILLARS.map((p) => (
              <div key={p.n} className="rounded-lg p-5 border" style={{ background: "#FBFAF5", borderColor: "#C9C0A8" }}>
                <div style={{ ...display, opacity: 0.2 }} className="text-2xl">{p.n}</div>
                <h3 style={{ ...display }} className="uppercase text-lg mt-1 mb-1">{p.t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4a3b2c" }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section className="py-16 px-6" style={{ background: BROWN }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] tracking-[0.3em] uppercase font-semibold mb-2" style={{ color: "rgba(234,230,210,0.6)" }}>What's inside</p>
          <h2 style={{ ...display, color: CREAM }} className="uppercase text-3xl sm:text-4xl leading-tight mb-6">The full system</h2>
          <ul className="space-y-3">
            {[
              "Four complete sessions — Upper / Lower, run twice through",
              "Every exercise with sets, reps, rest and 1–2 swap options",
              "The four pillars of hypertrophy — how every movement was chosen",
              "The double-progression model that makes it repeat forever",
              "Built on mechanical tension, proximity to failure and real overload",
              "One-off payment — download once, yours for life",
            ].map((item) => (
              <li key={item} style={{ color: "rgba(234,230,210,0.9)" }} className="flex gap-3 text-base leading-relaxed">
                <span style={{ color: "#E9C9A0" }}>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* OFFER / BUY */}
      <section style={{ background: PAPER, color: BROWN }} className="py-16 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 style={{ ...display }} className="uppercase text-3xl sm:text-4xl leading-tight mb-3">
            Less than a week <span style={{ ...serif, textTransform: "none" }}>of coaching.</span>
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: "#4a3b2c" }}>
            One-to-one coaching is $80/week. This is the same training philosophy, distilled into a system you run
            yourself — <b>$60 once, yours forever.</b> Founders launch: first 5 at half price with code <b>GROW</b>.
          </p>
          <BuyButton label="Get it now" />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6" style={{ background: BROWN }}>
        <div className="max-w-2xl mx-auto">
          <h2 style={{ ...display, color: CREAM }} className="uppercase text-3xl mb-6">Quick answers</h2>
          <div className="space-y-5">
            {FAQ.map((f) => (
              <div key={f.q}>
                <p style={{ color: CREAM, ...display }} className="text-base mb-1">{f.q}</p>
                <p style={{ color: "rgba(234,230,210,0.78)" }} className="text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COACHING FALLBACK */}
      <section style={{ background: PAPER, color: BROWN }} className="py-14 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-base leading-relaxed mb-4">
            Want it built around <i>you</i> — your body, your gym, your weak points, adjusted every week?
          </p>
          <Link href="/" style={{ ...body, color: BROWN }} className="inline-block underline font-semibold tracking-wide uppercase text-sm">
            See online coaching →
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center" style={{ background: BROWN }}>
        <p style={{ color: "rgba(234,230,210,0.45)" }} className="text-[11px] tracking-widest uppercase">
          © Lover Fighter Fitness · @loverfighterfitness
        </p>
      </footer>
    </div>
  );
}
