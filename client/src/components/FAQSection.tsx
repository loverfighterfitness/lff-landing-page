/**
 * FAQ Section — Lover Fighter Fitness
 * Accordion-style questions addressing the most common objections for online coaching
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqs } from "@shared/faqs";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Section divider top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[3px] bg-lff-cream/40 rounded-full" />

      <div className="max-w-3xl mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-lff-cream/50 text-xs tracking-[0.3em] uppercase font-medium mb-3">
            Got Questions
          </p>
          <h2
            className="text-4xl md:text-5xl font-display tracking-wider text-lff-cream"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FAQ
          </h2>
        </div>

        {/* Accordion — floating cream panel */}
        <div
          className="rounded-3xl px-6 py-8 md:px-10 md:py-10 mb-8"
          style={{
            backgroundColor: '#EAE6D2',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`
                  rounded-xl border-2 overflow-hidden transition-all duration-300
                  ${isOpen
                    ? "border-lff-brown/40 shadow-[0_0_24px_rgba(84,65,47,0.10)]"
                    : "border-lff-brown/15 hover:border-lff-brown/30"
                  }
                `}
                style={{
                  background: isOpen
                    ? "rgba(84,65,47,0.08)"
                    : "rgba(84,65,47,0.04)",
                }}
              >
                {/* Question row */}
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`text-base md:text-lg font-semibold transition-colors duration-200 ${
                      isOpen ? "" : ""
                    }`}
                    style={{ fontFamily: "var(--font-sans)", color: isOpen ? '#54412F' : 'rgba(84,65,47,0.80)' }}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`shrink-0 w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    style={{ color: isOpen ? '#54412F' : 'rgba(84,65,47,0.50)' }}
                  />
                </button>

                {/* Answer — animated expand */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p
                    className="px-6 pb-6 text-sm md:text-base leading-relaxed"
                    style={{ fontFamily: "var(--font-sans)", color: 'rgba(84,65,47,0.70)' }}
                  >
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        </div> {/* end floating cream panel */}

        {/* Bottom CTA nudge */}
        <p className="text-center text-lff-cream/40 text-sm mt-10">
          Still have a question?{" "}
          <a
            href="#contact"
            className="text-lff-cream/70 underline underline-offset-4 hover:text-lff-cream transition-colors"
          >
            Fill in the form below
          </a>{" "}
          and I'll get back to you within 24 hours.
        </p>
      </div>
    </section>
  );
}
