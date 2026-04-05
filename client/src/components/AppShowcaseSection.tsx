/**
 * App Showcase — Interactive phone carousel
 * Shows HubFit in action with 3D tilt, mouse parallax, auto-rotate,
 * clickable feature tabs, animated labels.
 * Replaces the old WhySection "What You Get" grid.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { LayoutGrid, Dumbbell, ClipboardCheck, Apple, TrendingDown, Users } from "lucide-react";

const features = [
  {
    icon: LayoutGrid,
    label: "Your Home Base",
    title: "DASHBOARD",
    description:
      "Tasks, check-ins, habits and challenges — all in one view. Open the app, know exactly what to do today.",
    image: "/app/dashboard.png",
    accent: "#EAE6D2",
  },
  {
    icon: Dumbbell,
    label: "Custom Programming",
    title: "YOUR PROGRAM",
    description:
      "Built from scratch for your body, your goals, your equipment. Every set, rep and rest period mapped out for you.",
    image: "/app/program.png",
    accent: "#C9A87C",
  },
  {
    icon: ClipboardCheck,
    label: "Weekly Check-Ins",
    title: "CHECK-INS",
    description:
      "Daily and weekly check-ins that I review personally. Training, nutrition, energy, sleep — I see everything.",
    image: "/app/checkins.png",
    accent: "#EAE6D2",
  },
  {
    icon: Apple,
    label: "Nutrition Tracking",
    title: "NUTRITION",
    description:
      "Log food, track macros, hit your targets. Full nutrition dashboard with meal breakdown and macro goals.",
    image: "/app/nutrition.png",
    accent: "#C9A87C",
  },
  {
    icon: TrendingDown,
    label: "Progress Tracking",
    title: "PROGRESS",
    description:
      "Weight, photos, body stats, steps — tracked over time. See the line trending the way you want it to.",
    image: "/app/weight.png",
    accent: "#C9A87C",
  },
  {
    icon: Users,
    label: "The LFF Team",
    title: "COMMUNITY",
    description:
      "You're never training alone. Challenges, polls, wins and banter — the whole LFF crew in one feed.",
    image: "/app/community.png",
    accent: "#EAE6D2",
  },
];

const AUTO_ADVANCE_MS = 5500;

export default function AppShowcaseSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Mouse parallax tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 18 });

  // Auto-advance carousel
  useEffect(() => {
    if (userInteracted) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % features.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [userInteracted]);

  const handleSelect = (i: number) => {
    setActiveIndex(i);
    setUserInteracted(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const active = features[activeIndex];

  return (
    <section
      ref={sectionRef}
      className="grain-overlay relative py-20 md:py-28 overflow-hidden"
      style={{ backgroundColor: "#54412F" }}
    >
      {/* Soft radial glow that shifts with active feature */}
      <motion.div
        key={`glow-${activeIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 70% 45%, ${active.accent} 0%, transparent 55%)`,
        }}
      />

      <div className="container relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16 max-w-2xl"
        >
          <p className="text-lff-cream/55 text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Everything In One App
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide text-lff-cream leading-[0.95]">
            THE APP THAT
            <br />
            RUNS IT ALL
          </h2>
          <p className="text-lff-cream/60 text-base md:text-lg leading-relaxed mt-6 max-w-xl">
            HubFit — custom-built for LFF clients. Every tool you need, one clean app.
          </p>
        </motion.div>

        {/* Main showcase area */}
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
          {/* LEFT: Feature label + description */}
          <div className="order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Number + icon row */}
                <div className="flex items-center gap-4 mb-5">
                  <span
                    className="font-display text-6xl md:text-7xl leading-none"
                    style={{ color: active.accent, opacity: 0.35 }}
                  >
                    0{activeIndex + 1}
                  </span>
                  <div
                    className="w-px h-12"
                    style={{ backgroundColor: "rgba(234,230,210,0.25)" }}
                  />
                  <motion.div
                    initial={{ scale: 0.6, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 240, damping: 18 }}
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: "rgba(234,230,210,0.08)" }}
                  >
                    <active.icon size={28} className="text-lff-cream" strokeWidth={1.6} />
                  </motion.div>
                </div>

                <p className="text-lff-cream/55 text-xs tracking-[0.25em] uppercase mb-2 font-medium">
                  {active.label}
                </p>
                <h3 className="font-display text-3xl md:text-5xl tracking-wide text-lff-cream mb-4 leading-[1]">
                  {active.title}
                </h3>
                <p className="text-lff-cream/75 text-base md:text-lg leading-relaxed max-w-md">
                  {active.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Tab pills */}
            <div className="flex flex-wrap gap-2 mt-8 md:mt-10">
              {features.map((f, i) => {
                const isActive = i === activeIndex;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className="group relative px-4 py-2.5 rounded-full text-xs tracking-[0.15em] uppercase font-semibold transition-all duration-300 cursor-pointer"
                    style={{
                      backgroundColor: isActive ? "#EAE6D2" : "rgba(234,230,210,0.06)",
                      color: isActive ? "#54412F" : "rgba(234,230,210,0.7)",
                      border: `1px solid ${isActive ? "#EAE6D2" : "rgba(234,230,210,0.15)"}`,
                    }}
                    aria-label={`Show ${f.label}`}
                    aria-pressed={isActive}
                  >
                    <span className="flex items-center gap-2">
                      <f.icon size={14} strokeWidth={2} />
                      {f.label}
                    </span>
                    {/* Progress bar for active tab */}
                    {isActive && !userInteracted && (
                      <motion.span
                        key={`progress-${activeIndex}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
                        className="absolute bottom-0 left-0 h-[2px] w-full rounded-full origin-left"
                        style={{ backgroundColor: "#54412F" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Phone stack with 3D tilt */}
          <div
            className="order-1 lg:order-2 relative flex items-center justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: "1200px" }}
          >
            {/* Ghost phones behind (preview of next/prev) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {features.map((f, i) => {
                const offset = i - activeIndex;
                const isActive = offset === 0;
                // Only show ±1 ghost neighbors
                if (Math.abs(offset) > 2) return null;
                if (isActive) return null;
                return (
                  <motion.div
                    key={`ghost-${i}`}
                    className="absolute"
                    initial={false}
                    animate={{
                      x: offset * 90,
                      scale: 0.72,
                      rotate: offset * 6,
                      opacity: Math.abs(offset) === 1 ? 0.35 : 0.12,
                      zIndex: 10 - Math.abs(offset),
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 24 }}
                  >
                    <PhoneFrame image={f.image} small />
                  </motion.div>
                );
              })}
            </div>

            {/* Active phone — big, tilts with mouse. Crossfade swap. */}
            <motion.div
              className="relative z-20"
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                width: 280,
                height: 572,
              }}
            >
              {features.map((f, i) => {
                const isActive = i === activeIndex;
                return (
                  <motion.div
                    key={i}
                    className="absolute inset-0"
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      scale: isActive ? 1 : 0.96,
                      filter: isActive ? "blur(0px)" : "blur(6px)",
                    }}
                    transition={{
                      opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                      scale: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                      filter: { duration: 0.45, ease: "easeOut" },
                    }}
                    style={{ pointerEvents: isActive ? "auto" : "none" }}
                  >
                    <PhoneFrame image={f.image} />
                  </motion.div>
                );
              })}

              {/* Glow pad beneath phone */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-[-40px] w-[70%] h-8 rounded-full blur-2xl pointer-events-none"
                style={{
                  backgroundColor: active.accent,
                  opacity: 0.35,
                  transition: "background-color 0.6s ease",
                }}
              />
            </motion.div>

            {/* Side nav arrows (desktop) */}
            <button
              onClick={() =>
                handleSelect((activeIndex - 1 + features.length) % features.length)
              }
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: "rgba(234,230,210,0.08)",
                border: "1px solid rgba(234,230,210,0.2)",
                color: "#EAE6D2",
              }}
              aria-label="Previous feature"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => handleSelect((activeIndex + 1) % features.length)}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: "rgba(234,230,210,0.08)",
                border: "1px solid rgba(234,230,210,0.2)",
                color: "#EAE6D2",
              }}
              aria-label="Next feature"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** iPhone-style frame wrapping an app screenshot */
function PhoneFrame({ image, small = false }: { image: string; small?: boolean }) {
  const width = small ? 220 : 280;
  const height = small ? 448 : 572;
  return (
    <div
      className="relative rounded-[42px] overflow-hidden"
      style={{
        width,
        height,
        backgroundColor: "#0a0a0a",
        padding: small ? 8 : 10,
        boxShadow:
          "0 40px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35), inset 0 0 0 1.5px rgba(234,230,210,0.12)",
      }}
    >
      {/* Dynamic Island */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full z-10"
        style={{
          width: small ? 70 : 90,
          height: small ? 18 : 24,
          backgroundColor: "#000",
        }}
      />
      {/* Screen */}
      <div
        className="w-full h-full rounded-[34px] overflow-hidden relative"
        style={{ backgroundColor: "#fff" }}
      >
        <img
          src={image}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover object-top select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
