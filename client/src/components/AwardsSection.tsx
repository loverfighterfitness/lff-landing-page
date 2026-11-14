/**
 * Awards — the LFF Coaching app's awards that evolve as you train: the six families, the Thousand Pound Club trophy
 * and the Legend. Each card is a short looping clip rendered from the app's own 3D models (lff-coaching-app:
 * tools/club-award-3d/blender/turntable.py + web_clips.py), served from /awards/.
 *
 * Light on a phone: nothing loads until a card is about to scroll into view (the poster and the clip both), a clip
 * plays only while it's on screen, and with Reduce Motion on it stays on its poster.
 * Words: as Levi OK'd them (2026-11-14).
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const GROUND = "#4A3828"; // the clips' own ground, so a card and its clip are one surface

/** ground: the clip's own background, where it differs from GROUND (none today: every clip is made the same way). */
type Award = { file: string; name: string; line: string; ground?: string };

const FEATURED: Award[] = [
  {
    file: "trophy",
    name: "Thousand Pound Club",
    line: "Squat, bench and deadlift, one rep each, 1,000 lb in total. Film every lift and Levi watches all three before it counts.",
  },
  {
    file: "legend",
    name: "The Legend",
    line: "Collect every medal in the app and the Legend is yours: the gold cup, with Levi and Prince cast beside it.",
  },
];

const FAMILIES: Award[] = [
  { file: "workouts", name: "Workouts", line: "Iron Plate to The Gold Bar · 7 stages" },
  { file: "weeks", name: "Weeks in a Row", line: "Ember to Beacon · 4 stages" },
  { file: "prs", name: "Personal Records", line: "Mark to Summit · 4 stages" },
  { file: "volume", name: "Total Weight Lifted", line: "Iron Block to The Tower · 5 stages" },
  { file: "strength", name: "Body-weight Strength", line: "Bench, squat and deadlift · 6 stages" },
  { file: "collection", name: "Medals Collected", line: "Stand to The Legend · 4 stages" },
];

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** A muted looping clip that loads when near the screen and plays only while on it. */
function LoopClip({ file, label, ground = GROUND }: { file: string; label: string; ground?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  // On screen right now: a clip that finishes loading while it's on screen starts then (the observer fired before).
  const visible = useRef(false);
  const still = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    still.current = prefersReducedMotion();
    const load = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          load.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    const play = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible.current = e.isIntersecting;
          if (still.current) continue;
          if (e.isIntersecting) void el.play().catch(() => undefined);
          else el.pause();
        }
      },
      { threshold: 0.35 }
    );
    load.observe(el);
    play.observe(el);
    return () => {
      load.disconnect();
      play.disconnect();
    };
  }, []);

  // The source arrives after the observers first fire: start it now if the card is already on screen.
  useEffect(() => {
    const el = ref.current;
    if (near && el && visible.current && !still.current) void el.play().catch(() => undefined);
  }, [near]);

  return (
    <video
      ref={ref}
      className="block w-full h-auto"
      style={{ aspectRatio: "4 / 5", backgroundColor: ground }}
      src={near ? `/awards/${file}.mp4` : undefined}
      poster={near ? `/awards/${file}.webp` : undefined}
      muted
      loop
      playsInline
      preload="none"
      onCanPlay={(e) => {
        if (visible.current && !still.current && e.currentTarget.paused) void e.currentTarget.play().catch(() => undefined);
      }}
      aria-label={label}
    />
  );
}

function Card({ award, big = false, index }: { award: Award; big?: boolean; index: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      // A featured card lies on its side from md up: the clip on the left, the words beside it.
      className={`m-0 overflow-hidden rounded-2xl ${big ? "md:flex md:items-center" : ""}`}
      style={{ backgroundColor: award.ground ?? GROUND, border: "1px solid rgba(234,230,210,0.08)", boxShadow: "0 18px 50px rgba(0,0,0,0.28)" }}
    >
      <div className={big ? "md:w-[46%] md:shrink-0" : ""}>
        <LoopClip file={award.file} label={`${award.name}, turning`} ground={award.ground} />
      </div>
      <figcaption className={big ? "px-6 pb-6 pt-1 md:p-6 md:pl-2" : "px-4 pb-4 pt-0.5 md:px-5 md:pb-5"}>
        <p
          className={`font-display tracking-wide text-lff-cream leading-tight ${big ? "text-2xl md:text-3xl" : "text-base md:text-xl"}`}
        >
          {award.name.toUpperCase()}
        </p>
        <p className={`text-lff-cream/60 leading-snug mt-1.5 ${big ? "text-sm md:text-base md:mt-3" : "text-xs md:text-sm"}`}>{award.line}</p>
      </figcaption>
    </motion.figure>
  );
}

export default function AwardsSection() {
  return (
    <section id="awards" className="grain-overlay relative py-20 md:py-28 overflow-hidden" style={{ backgroundColor: "#3B2D20" }}>
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16 max-w-2xl"
        >
          <p className="text-lff-cream/55 text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">Awards in the app</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide text-lff-cream leading-[0.95]">
            EARN IT.
            <br />
            WATCH IT EVOLVE.
          </h2>
          <p className="text-lff-cream/60 text-base md:text-lg leading-relaxed mt-6 max-w-xl">
            Every workout, every week you show up and every PR builds something in the LFF Coaching app. Your awards evolve
            as you train, from an iron plate all the way to the gold bar.
          </p>
        </motion.div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-2 mb-4 md:mb-6">
          {FEATURED.map((a, i) => (
            <Card key={a.file} award={a} big index={i} />
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {FAMILIES.map((a, i) => (
            <Card key={a.file} award={a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
