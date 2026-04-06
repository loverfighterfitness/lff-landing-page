/**
 * Stats Section — Animated count-up numbers
 * Sits between Hero and Why sections for social proof dynamism
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { value: 5, suffix: ".0★", label: "Google Rating" },
  { value: 100, suffix: "+", label: "Success Stories" },
  { value: 3, suffix: "+", label: "Years Coaching" },
  { value: 100, suffix: "%", label: "Online, World-Wide" },
];

function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-in-out that snaps hard at the end — avoids slow final crawl
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      // snap to target once we're at 92% to avoid the last-digit crawl
      if (progress >= 0.92) {
        setCount(target);
        return;
      }
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function AnimatedStat({ stat, delay }: { stat: Stat; delay: number }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const count = useCountUp(stat.value, 1600, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay }}
      className="flex flex-col items-center text-center"
    >
      <div className="font-display text-5xl md:text-6xl lg:text-7xl tracking-wide leading-none" style={{ color: '#54412F' }}>
        {count}{stat.suffix}
      </div>
      <p className="text-sm tracking-[0.2em] uppercase mt-3 font-medium" style={{ color: 'rgba(84,65,47,0.55)' }}>
        {stat.label}
      </p>
    </motion.div>
  );
}

export default function StatsSection() {
  return (
    <section className="grain-overlay py-16 md:py-20" style={{ backgroundColor: '#54412F' }}>
      <div className="container">
        {/* Floating cream panel */}
        <div
          className="rounded-3xl px-8 py-12 md:px-14 md:py-14"
          style={{
            backgroundColor: '#EAE6D2',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {stats.map((stat, i) => (
            <AnimatedStat key={i} stat={stat} delay={i * 0.1} />
          ))}
        </div>
        </div> {/* end floating cream panel */}
      </div>
    </section>
  );
}
