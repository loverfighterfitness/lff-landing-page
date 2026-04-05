/**
 * Before / After Section — multi-transformation slider
 * Draggable image comparison slider with spring physics + prev/next navigation
 * Animates between portrait (Ruby) and landscape (Kim) aspect ratios
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Transformation {
  paddingBottom: string;
  maxWidth: string;
  layout: "side" | "stack"; // side = slider left + text right, stack = slider top + text below
  before: string;
  after: string;
  beforeStyle: React.CSSProperties;
  afterStyle: React.CSSProperties;
  afterLabel: string;
  name: string;
  tag: string;
  copy: string;
  quote: string;
  author: string;
}

const TRANSFORMATIONS: Transformation[] = [
  {
    paddingBottom: "177.78%", // portrait 9:16
    maxWidth: "260px",
    layout: "side" as const,
    before: "/transformations/before.jpg",
    after: "/transformations/after.jpg",
    beforeStyle: { position: "absolute", width: "100%", height: "auto", top: 0 },
    afterStyle:  { position: "absolute", width: "100%", height: "auto", top: "45px" },
    afterLabel: "Comp Day",
    name: "Ruby",
    tag: "Comp Prep · Placed 2nd",
    copy: "Ruby came to Levi with a dream of stepping on stage. She left her first show with a 2nd place trophy — and came back for more.",
    quote: "His coaching is truly the best investment I have ever made.",
    author: "Ruby Frang, Comp Prep Client",
  },
  {
    paddingBottom: "75%", // landscape 4:3
    maxWidth: "100%",
    layout: "stack" as const,
    before: "/transformations/kim-before.jpg",
    after: "/transformations/kim-after.jpg",
    beforeStyle: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" as const, objectPosition: "25% 25%" },
    afterStyle:  { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" as const, objectPosition: "25% 15%" },
    afterLabel: "After",
    name: "Kim",
    tag: "Fat Loss · XL → Size M",
    copy: "Kim dropped two full dress sizes in just 4 months. From XL to size M — her transformation blew the whole gym away.",
    quote: "You are more than a PT, you are my friend.",
    author: "Kim Morrison, F2F Client",
  },
  {
    paddingBottom: "177.78%", // portrait 9:16
    maxWidth: "260px",
    layout: "side" as const,
    before: "/transformations/leigh-before.png",
    after: "/transformations/leigh-after.png",
    beforeStyle: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" as const, objectPosition: "15% center" },
    afterStyle:  { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" as const, objectPosition: "15% center", transform: "scale(1.22)" },
    afterLabel: "After",
    name: "Leigh",
    tag: "Online Coaching · -14kg",
    copy: "Leigh dropped 14kg with consistent training and dialled nutrition. Steady work, real results.",
    quote: "Couldn't be happier with the progress.",
    author: "Leigh, Online Coaching Client",
  },
];

interface SliderProps {
  transformation: Transformation;
  resetKey: number;
}

function ImageComparisonSlider({ transformation, resetKey }: SliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const rawX = useMotionValue(0.5);
  const springX = useSpring(rawX, { stiffness: 1400, damping: 80, mass: 0.3 });
  const [pct, setPct] = useState(50);

  useEffect(() => {
    rawX.set(0.5);
  }, [resetKey, rawX]);

  useEffect(() => {
    return springX.on("change", (v) => setPct(v * 100));
  }, [springX]);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    const clamped = Math.min(Math.max((clientX - left) / width, 0.02), 0.98);
    rawX.set(clamped);
  }, [rawX]);

  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setDragging(true); updateFromClientX(e.clientX); };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => updateFromClientX(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, updateFromClientX]);

  const onTouchStart = (e: React.TouchEvent) => { setDragging(true); updateFromClientX(e.touches[0].clientX); };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: TouchEvent) => updateFromClientX(e.touches[0].clientX);
    const onUp = () => setDragging(false);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
  }, [dragging, updateFromClientX]);

  return (
    <motion.div
      className="relative w-full select-none"
      animate={{ paddingBottom: transformation.paddingBottom }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      initial={false}
    >
      {/* Inner: fills the padding-created space */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden rounded-2xl"
        style={{ cursor: dragging ? "ew-resize" : "grab", touchAction: "pan-y", backgroundColor: "#1c0f07" }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* After (bottom layer) */}
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: "#1c0f07" }}>
          <img src={transformation.after} alt="After" draggable={false} style={transformation.afterStyle} />
        </div>

        {/* Before (clipped left) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pct}% 0 0)`, backgroundColor: "#1c0f07" }}
        >
          <img src={transformation.before} alt="Before" draggable={false} style={transformation.beforeStyle} />
        </div>

        {/* Divider */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
          style={{ left: springX.get() * 100 + "%", x: "-50%", backgroundColor: "#EAE6D2", boxShadow: "0 0 12px rgba(0,0,0,0.4)" }}
        />

        {/* Handle */}
        <motion.div
          className="absolute top-1/2 pointer-events-none flex items-center justify-center"
          style={{ left: `${pct}%`, y: "-50%", x: "-50%", width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#EAE6D2", boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}
        >
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <path d="M5 6H1M1 6L3.5 3.5M1 6L3.5 8.5" stroke="#54412F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 6H17M17 6L14.5 3.5M17 6L14.5 8.5" stroke="#54412F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>

        {/* Labels */}
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <span className="px-2 py-1 rounded-md text-xs font-black tracking-wider uppercase" style={{ backgroundColor: "rgba(84,65,47,0.75)", color: "#EAE6D2", opacity: pct > 20 ? 1 : 0, transition: "opacity 0.2s" }}>
            Before
          </span>
        </div>
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <span className="px-2 py-1 rounded-md text-xs font-black tracking-wider uppercase" style={{ backgroundColor: "rgba(84,65,47,0.75)", color: "#EAE6D2", opacity: pct < 80 ? 1 : 0, transition: "opacity 0.2s" }}>
            {transformation.afterLabel}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function BeforeAfterSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const go = (i: number) => { setActiveIndex(i); setResetKey(k => k + 1); };
  const prev = () => go((activeIndex - 1 + TRANSFORMATIONS.length) % TRANSFORMATIONS.length);
  const next = () => go((activeIndex + 1) % TRANSFORMATIONS.length);

  const current = TRANSFORMATIONS[activeIndex];

  return (
    <section className="grain-overlay relative py-24 md:py-32 overflow-hidden" style={{ backgroundColor: "#54412F" }}>
      <div className="container">
        <div
          className="rounded-3xl px-8 py-14 md:px-14 md:py-16"
          style={{ backgroundColor: "#EAE6D2", boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)" }}
        >
          <div className={`flex gap-8 sm:gap-12 items-center ${current.layout === "side" ? "flex-col md:flex-row" : "flex-col"}`}>

            {/* Left/Top — slider + nav */}
            <div className={`flex flex-col items-center gap-4 flex-shrink-0 mx-auto ${current.layout === "side" ? "w-full max-w-[260px]" : "w-full max-w-[420px] md:max-w-[560px]"}`} style={{ transition: "width 0.55s cubic-bezier(0.4,0,0.2,1)" }}>
              <div className="w-full flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    className="w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ImageComparisonSlider transformation={current} resetKey={resetKey} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Prev / dots / next */}
              <div className="flex items-center gap-4">
                <button onClick={prev} className="flex items-center justify-center rounded-full transition-all" style={{ width: "38px", height: "38px", backgroundColor: "rgba(84,65,47,0.12)", color: "#54412F" }}>
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-2">
                  {TRANSFORMATIONS.map((_, i) => (
                    <button key={i} onClick={() => go(i)} className="rounded-full transition-all" style={{ width: i === activeIndex ? "20px" : "8px", height: "8px", backgroundColor: i === activeIndex ? "#54412F" : "rgba(84,65,47,0.25)" }} />
                  ))}
                </div>
                <button onClick={next} className="flex items-center justify-center rounded-full transition-all" style={{ width: "38px", height: "38px", backgroundColor: "rgba(84,65,47,0.12)", color: "#54412F" }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Right/Bottom — copy */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                className="flex-1 min-w-0 w-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                <p className="text-xs tracking-[0.3em] uppercase mb-2 font-black" style={{ color: "rgba(84,65,47,0.50)" }}>Client Results</p>
                <p className="text-xs tracking-[0.2em] uppercase mb-4 font-bold" style={{ color: "rgba(84,65,47,0.40)" }}>{current.tag}</p>
                <h2 className="font-display leading-[0.92] mb-6" style={{ color: "#54412F", fontSize: "clamp(1.6rem, 6vw, 4.5rem)", fontWeight: 900 }}>
                  THE PROOF<br /><span style={{ color: "rgba(84,65,47,0.45)" }}>IS IN THE RESULTS.</span>
                </h2>
                <p className="text-base leading-relaxed mb-8 font-normal" style={{ color: "rgba(84,65,47,0.75)" }}>{current.copy}</p>
                <blockquote className="border-l-4 pl-5 mb-8" style={{ borderColor: "rgba(84,65,47,0.30)" }}>
                  <p className="text-base italic leading-relaxed" style={{ color: "rgba(84,65,47,0.70)" }}>"{current.quote}"</p>
                  <footer className="mt-2 text-xs font-black tracking-wider uppercase" style={{ color: "rgba(84,65,47,0.45)" }}>— {current.author}</footer>
                </blockquote>
                <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "rgba(84,65,47,0.40)" }}>Drag the slider to reveal the transformation</p>
              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      </div>
    </section>
  );
}
