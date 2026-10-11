/**
 * /learn and /learn/:slug — long-form versions of Levi's reels.
 * Content lives in shared/articles.ts so the server can render the same copy for crawlers.
 */
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRoute } from "wouter";
import Navbar from "@/components/Navbar";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import NotFound from "@/pages/NotFound";
import { articles, articleBySlug, LEARN_INDEX, type Article, type ArticleBlock } from "@shared/articles";

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00+10:30`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

function Shell({ children, source }: { children: React.ReactNode; source: string }) {
  return (
    <div className="min-h-screen text-lff-cream" style={{ backgroundColor: "#54412F" }}>
      <Navbar />
      {children}
      <ContactSection source={source} />
      <Footer />
    </div>
  );
}

export function LearnIndex() {
  return (
    <Shell source="page:/learn">
      <header className="grain-overlay pt-32 pb-12 md:pt-44 md:pb-16">
        <div className="container max-w-3xl">
          <p className="text-lff-cream/55 text-sm tracking-[0.3em] uppercase mb-5 font-medium">Guides</p>
          <h1 className="font-display text-5xl md:text-7xl tracking-wide uppercase leading-[0.95] mb-6">{LEARN_INDEX.h1}</h1>
          <p className="text-lff-cream/75 text-lg leading-relaxed font-light max-w-2xl">{LEARN_INDEX.intro}</p>
        </div>
      </header>
      <main className="container max-w-3xl pb-24 space-y-4">
        {articles.map(a => (
          <a
            key={a.slug}
            href={`/learn/${a.slug}`}
            className="group block rounded-2xl border-2 border-lff-cream/15 p-6 md:p-8 hover:border-lff-cream/40 transition-colors"
          >
            <p className="text-lff-cream/50 text-xs tracking-[0.25em] uppercase mb-3">
              {a.topic} · {a.readMinutes} min read
            </p>
            <h2 className="font-display text-2xl md:text-3xl tracking-wide uppercase leading-tight mb-3">{a.h1}</h2>
            <p className="text-lff-cream/65 leading-relaxed">{a.description}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lff-cream/80">
              Read <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        ))}
      </main>
    </Shell>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="font-display text-2xl md:text-3xl tracking-wide uppercase leading-tight pt-6">{block.text}</h2>;
    case "ul":
      return (
        <ul className="space-y-3">
          {block.items.map((t, i) => (
            <li key={i} className="flex gap-3 leading-relaxed text-lff-cream/80">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lff-cream/50" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      );
    case "formula":
      return (
        <p
          className="rounded-xl px-5 py-4 font-semibold"
          style={{ backgroundColor: "#EAE6D2", color: "#54412F" }}
        >
          {block.text}
        </p>
      );
    default:
      return <p className="leading-relaxed text-lff-cream/80">{block.text}</p>;
  }
}

function ArticleView({ article }: { article: Article }) {
  return (
    <Shell source={`page:/learn/${article.slug}`}>
      <article>
        <header className="grain-overlay pt-32 pb-10 md:pt-44 md:pb-14">
          <div className="container max-w-2xl">
            <a href="/learn" className="inline-flex items-center gap-2 text-sm text-lff-cream/55 hover:text-lff-cream mb-8">
              <ArrowLeft size={14} /> All guides
            </a>
            <p className="text-lff-cream/55 text-xs tracking-[0.3em] uppercase mb-4 font-medium">
              {article.topic} · {article.readMinutes} min read
            </p>
            <h1 className="font-display text-4xl md:text-6xl tracking-wide uppercase leading-[0.95] mb-6">{article.h1}</h1>
            <p className="text-sm text-lff-cream/55">
              Levi Hurst · {formatDate(article.date)}
            </p>
          </div>
        </header>
        <div className="container max-w-2xl pb-16 space-y-5 text-base md:text-lg">
          {article.body.map((b, i) => (
            <Block key={i} block={b} />
          ))}
          <a
            href={article.cta.path}
            className="group mt-10 flex items-center justify-between gap-4 rounded-2xl border-2 border-lff-cream/25 px-6 py-5 hover:border-lff-cream/50 transition-colors"
          >
            <span className="font-semibold">{article.cta.text}</span>
            <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </article>
    </Shell>
  );
}

export default function LearnArticle() {
  const [, params] = useRoute("/learn/:slug");
  const article = params ? articleBySlug[params.slug] : undefined;
  return article ? <ArticleView article={article} /> : <NotFound />;
}
