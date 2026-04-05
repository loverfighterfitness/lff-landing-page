/**
 * Hero Section — Large centered logo, single brown, Stan Store-inspired minimal
 */
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";

export default function HeroSection() {
  return (
    <section className="grain-overlay relative min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#54412F' }}>
      <div className="container relative z-10 pt-24 pb-16 flex flex-col items-center text-center">

        {/* Large Centered Logo */}
        <div className="mb-10 md:mb-14">
          <AnimatedLogo className="h-36 sm:h-48 md:h-60 lg:h-72 w-auto" />
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-lff-cream/60 text-sm tracking-[0.35em] uppercase mb-8 font-medium"
        >
          Online Coaching · World-Wide
        </motion.p>

        {/* Headline — mixed typography */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mb-6 max-w-3xl"
        >
          {/* Line 1: heavy sans-serif */}
          <span
            className="block font-display leading-[0.92] tracking-wide text-lff-cream"
            style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', fontWeight: 900 }}
          >
            COACHING BUILT
          </span>
          {/* Line 2: large italic serif */}
          <span
            className="block leading-[1.1]"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 'clamp(3.2rem, 9vw, 8.5rem)',
              color: '#EAE6D2',
              opacity: 0.88,
              paddingBottom: '0.2em',
            }}
          >
            For You.
          </span>
        </motion.h1>

        {/* Thin rule */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="w-24 mb-8 origin-left"
          style={{ height: '1.5px', backgroundColor: 'rgba(234,230,210,0.35)' }}
        />

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="text-lff-cream/75 text-lg md:text-xl max-w-xl leading-relaxed mb-10 font-normal"
        >
          Personalised strength, bodybuilding, and competition prep coaching.
          Custom programming, weekly check-ins, real results.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="flex flex-col items-center gap-3 mb-10 md:mb-12"
        >
          <div className="flex flex-wrap gap-4 justify-center">
            {/* Primary CTA - Scroll to coaching */}
            <motion.a
              href="#coaching"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 bg-lff-cream text-lff-brown font-bold tracking-wider uppercase text-sm rounded-full hover:opacity-90 transition-all duration-300 cta-pulse btn-shimmer shadow-lg"
            >
              See The Coaching
            </motion.a>
            {/* Secondary CTA - Book a call */}
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 border-2 border-lff-cream/40 text-lff-cream/70 font-semibold tracking-wider uppercase text-sm rounded-full transition-all duration-300"
            >
              Book a Call
            </motion.a>
          </div>
          {/* Risk reversal micro-copy */}
          <p className="text-lff-cream/45 text-xs tracking-wide font-medium">
            No lock-in contracts · Cancel anytime
          </p>
        </motion.div>

        {/* Social proof micro-copy — trust hook below CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex items-center gap-3 mb-12 md:mb-16"
        >
          {/* Avatar stack — real client photos */}
          <div className="flex -space-x-2">
            {[
              { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/ruby-comp-day_e2742a4b.jpeg", pos: "center 20%" },
              { src: "/transformations/kim-testimonial.jpg", pos: "center 20%" },
              { src: "/transformations/leigh-after.png", pos: "25% 20%" },
              { src: "/transformations/laura.jpg", pos: "center 15%" },
              { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/440F56C7-42C7-4BEF-AA2B-04F320CCBC31_ddfd61dc.jpeg", pos: "center 20%" },
            ].map((p, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full overflow-hidden border-2 flex-shrink-0"
                style={{
                  borderColor: "rgba(234,230,210,0.35)",
                  zIndex: 5 - i,
                }}
              >
                <img
                  src={p.src}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ objectPosition: p.pos }}
                  draggable={false}
                />
              </div>
            ))}
          </div>
          <p className="text-lff-cream/55 text-xs font-medium tracking-wide flex items-center gap-1.5">
            <span className="text-yellow-400/90 tracking-tight">★★★★★</span>
            <span className="text-lff-cream/80 font-bold">5.0</span>
            <span>·</span>
            <span>16 Google reviews</span>
          </p>
        </motion.div>

        {/* VSL Video — hidden until real video is ready */}

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-12 flex flex-col items-center gap-2"
        >
          <span className="text-lff-cream/30 text-xs tracking-[0.3em] uppercase font-medium">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={18} className="text-lff-cream/25" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
