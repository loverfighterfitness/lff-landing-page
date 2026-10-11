/**
 * Service + location landing page (Mount Barker PT, Adelaide comp prep, online coaching).
 * Content lives in shared/localPages.ts so the server can render the same copy for crawlers.
 */
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { localPageByPath, type LocalPage as Page } from "@shared/localPages";

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6 },
};

export default function LocalPage({ page }: { page: Page }) {
  return (
    <div className="min-h-screen bg-lff-dark text-lff-cream" style={{ backgroundColor: "#54412F" }}>
      <Navbar />

      {/* Hero */}
      <header className="grain-overlay relative pt-32 pb-16 md:pt-44 md:pb-24">
        <div className="container max-w-4xl">
          <p className="text-lff-cream/55 text-sm tracking-[0.3em] uppercase mb-5 font-medium">{page.eyebrow}</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl tracking-wide uppercase leading-[0.95] mb-8">
            {page.h1}
          </h1>
          <div className="space-y-4 max-w-2xl">
            {page.intro.map((t, i) => (
              <p key={i} className="text-lff-cream/75 text-base md:text-lg leading-relaxed font-light">
                {t}
              </p>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: "#EAE6D2", color: "#54412F" }}
            >
              Let's chat
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="/#coaching"
              className="inline-flex items-center rounded-full border-2 border-lff-cream/25 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-lff-cream/80 hover:border-lff-cream/50 hover:text-lff-cream transition-colors"
            >
              See coaching packages
            </a>
          </div>
        </div>
      </header>

      {/* Proof strip */}
      <section className="container max-w-4xl pb-8">
        <div className="grid sm:grid-cols-3 border-2 border-lff-cream/15 rounded-2xl overflow-hidden">
          {page.proof.map((p, i) => (
            <div
              key={i}
              className="p-6 md:p-8 border-b-2 sm:border-b-0 sm:border-r-2 last:border-0 border-lff-cream/10"
            >
              <p className="font-display text-3xl md:text-4xl tracking-wide">{p.stat}</p>
              <p className="mt-2 text-lff-cream/60 text-sm leading-snug">{p.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Body sections */}
      <main className="container max-w-4xl py-12 md:py-20 space-y-16 md:space-y-20">
        {page.sections.map((sec, i) => (
          <motion.section key={i} {...reveal}>
            <div className="border-t-2 border-lff-cream/15 pt-10">
              <h2 className="font-display text-3xl md:text-4xl tracking-wide uppercase leading-none mb-6">
                {sec.heading}
              </h2>
              <div className="max-w-2xl space-y-4">
                {sec.paragraphs?.map((t, j) => (
                  <p key={j} className="text-lff-cream/75 leading-relaxed">
                    {t}
                  </p>
                ))}
                {sec.bullets && (
                  <ul className="space-y-3">
                    {sec.bullets.map((t, j) => (
                      <li key={j} className="flex gap-3 text-lff-cream/75 leading-relaxed">
                        <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lff-cream/50" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {sec.steps && (
                  <ol className="space-y-3">
                    {sec.steps.map((t, j) => (
                      <li key={j} className="flex gap-4 text-lff-cream/75 leading-relaxed">
                        <span className="font-display text-lff-cream/50 w-6 shrink-0">{j + 1}</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </motion.section>
        ))}

        {/* Related pages */}
        <nav aria-label="More coaching" className="border-t-2 border-lff-cream/15 pt-10">
          <p className="text-lff-cream/55 text-sm tracking-[0.3em] uppercase mb-5 font-medium">More coaching</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {page.related.map(path => {
              const rel = localPageByPath[path];
              return (
                <a
                  key={path}
                  href={path}
                  className="group flex items-center justify-between rounded-2xl border-2 border-lff-cream/15 px-6 py-5 hover:border-lff-cream/40 transition-colors"
                >
                  <span className="font-semibold">{rel.name}</span>
                  <ArrowRight size={16} className="text-lff-cream/50 transition-transform group-hover:translate-x-1" />
                </a>
              );
            })}
          </div>
        </nav>
      </main>

      <FAQSection items={page.faqs} />
      <ContactSection source={`page:${page.path}`} defaultGoal={page.goal} />
      <Footer />
    </div>
  );
}
