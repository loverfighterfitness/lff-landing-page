/**
 * About Section — Photo carousel + bio
 * Cover photo (arms-crossed portrait) is first, others follow
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instagram, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

// Cover photo (arms-crossed portrait) first, then the rest
const PHOTOS = [
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/3364F913-BF35-4897-B42E-9359661B16E7_41a0bda7.jpeg",
    alt: "Levi Hurst — Lover Fighter Fitness",
    position: "object-top",
  },
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/DSC00890_1144300a.JPG",
    alt: "Levi coaching a client at Snap Fitness",
    position: "object-center",
  },
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/DSC00920_e744cb35.JPG",
    alt: "Levi coaching at the gym",
    position: "object-center",
  },
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/440F56C7-42C7-4BEF-AA2B-04F320CCBC31_ddfd61dc.jpeg",
    alt: "Levi and client with competition medals",
    position: "object-top",
  },
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/32573F13-741F-4AB6-907C-809AEAB372EB-labbet-app_4b70f2ab.JPG",
    alt: "Levi flexing in the gym mirror",
    position: "object-center",
  },
];

function PhotoCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);
  // Track whether the first auto-advance has happened yet
  const hasAdvancedRef = useRef(false);

  const goTo = useCallback(
    (index: number, dir: number) => {
      setDirection(dir);
      setCurrent((index + PHOTOS.length) % PHOTOS.length);
    },
    []
  );

  const prev = () => goTo(current - 1, -1);
  const next = () => goTo(current + 1, 1);

  // Auto-advance: wait 8s on the first photo, then 5s for each subsequent photo
  useEffect(() => {
    const delay = !hasAdvancedRef.current ? 8000 : 5000;
    const timer = setTimeout(() => {
      hasAdvancedRef.current = true;
      goTo(current + 1, 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [current, goTo]);

  // Touch swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div
      className="relative aspect-[3/4] rounded-2xl overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.img
          key={current}
          src={PHOTOS[current].src}
          alt={PHOTOS[current].alt}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className={`absolute inset-0 w-full h-full object-cover ${PHOTOS[current].position}`}
          draggable={false}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-lff-brown/40 via-transparent to-transparent pointer-events-none" />

      {/* Prev / Next buttons */}
      <button
        onClick={prev}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-lff-brown/60 border border-lff-cream/15 text-lff-cream/70 hover:text-lff-cream hover:bg-lff-brown/80 transition-all duration-200 backdrop-blur-sm"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-lff-brown/60 border border-lff-cream/15 text-lff-cream/70 hover:text-lff-cream hover:bg-lff-brown/80 transition-all duration-200 backdrop-blur-sm"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 1 : -1)}
            aria-label={`Go to photo ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-5 h-1.5 bg-lff-cream"
                : "w-1.5 h-1.5 bg-lff-cream/35 hover:bg-lff-cream/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function AboutSection() {
  return (
    <section id="about" className="grain-overlay relative py-24 md:py-32" style={{ backgroundColor: "#54412F" }}>
      <div className="container">
        {/* Floating cream panel */}
        <div
          className="rounded-3xl px-8 py-14 md:px-14 md:py-16"
          style={{
            backgroundColor: '#EAE6D2',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Carousel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 70, damping: 20 }}
            className="relative"
          >
            <PhotoCarousel />
          </motion.div>

          {/* Right — Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.15 }}
          >
            <p className="text-sm tracking-[0.3em] uppercase mb-4 font-medium" style={{ color: 'rgba(84,65,47,0.55)' }}>
              Your Coach
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide leading-[0.95] mb-8" style={{ color: '#54412F' }}>
              MEET LEVI
            </h2>

            <div className="space-y-5 mb-8">
              <p className="text-lg leading-relaxed font-normal" style={{ color: 'rgba(84,65,47,0.80)' }}>
                I'm Levi — a 25-year-old online coach based in the Adelaide
                Hills, coaching clients world-wide. I started Lover Fighter
                Fitness because I believe everyone deserves coaching that's
                actually built for them, not recycled templates or
                one-size-fits-all plans.
              </p>
              <p className="text-lg leading-relaxed font-normal" style={{ color: 'rgba(84,65,47,0.80)' }}>
                My focus is strength training, bodybuilding, and competition
                prep. Whether you're just getting started or you're chasing a
                stage-ready physique, I'll build a program around your life, your
                goals, and where you're at right now.
              </p>
              <p className="text-lg leading-relaxed font-normal" style={{ color: 'rgba(84,65,47,0.80)' }}>
                I coach because I genuinely care about seeing people get
                stronger — physically and mentally. If you're ready to put in the
                work, I'm ready to guide you.
              </p>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 mb-8">
              <MapPin size={14} style={{ color: 'rgba(84,65,47,0.35)' }} />
              <span className="text-base font-normal" style={{ color: 'rgba(84,65,47,0.60)' }}>
                Adelaide Hills, SA · Coaching World-wide
              </span>
            </div>

            {/* Instagram */}
            <motion.a
              href="https://www.instagram.com/loverfighterfitness/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97, y: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="inline-flex items-center gap-3 px-6 py-3 border-2 rounded-full transition-colors duration-300"
              style={{ borderColor: 'rgba(84,65,47,0.35)', color: 'rgba(84,65,47,0.60)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(84,65,47,0.70)'; (e.currentTarget as HTMLElement).style.color = '#54412F'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(84,65,47,0.35)'; (e.currentTarget as HTMLElement).style.color = 'rgba(84,65,47,0.60)'; }}
            >
              <Instagram size={16} />
              <span className="text-sm font-medium tracking-wider uppercase">
                @loverfighterfitness
              </span>
            </motion.a>
          </motion.div>
        </div>
        </div> {/* end floating cream panel */}
      </div>
    </section>
  );
}
