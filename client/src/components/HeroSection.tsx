/**
 * Hero Section — Large centered logo, single brown, Stan Store-inspired minimal
 */
import { motion } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import AnimatedLogo from "./AnimatedLogo";

export default function HeroSection() {
  const { checkout, loading } = useStripeCheckout();

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
          className="flex flex-wrap gap-4 justify-center mb-16 md:mb-20"
        >
          {/* Primary CTA - Start Coaching */}
          <motion.button
            onClick={() => checkout("standardCoaching")}
            disabled={loading === "standardCoaching"}
            whileHover={!loading ? { scale: 1.06 } : undefined}
            whileTap={!loading ? { scale: 0.98 } : undefined}
            className="px-10 py-4 bg-lff-cream text-lff-brown font-bold tracking-wider uppercase text-sm rounded-full hover:opacity-90 transition-all duration-300 cta-pulse btn-shimmer shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading === "standardCoaching" ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Loading...
              </>
            ) : (
              "Start Coaching"
            )}
          </motion.button>
          {/* Secondary CTA - See Packages */}
          <motion.a
            href="#coaching"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 border-2 border-lff-cream/40 text-lff-cream/70 font-semibold tracking-wider uppercase text-sm rounded-full transition-all duration-300"
          >
            See Packages
          </motion.a>
        </motion.div>

        {/* Social proof micro-copy — trust hook below CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex items-center gap-3 mb-12 md:mb-16"
        >
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {["R","K","J","A","S"].map((initial, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 flex-shrink-0"
                style={{
                  backgroundColor: `rgba(234,230,210,${0.12 + i * 0.04})`,
                  borderColor: "rgba(234,230,210,0.25)",
                  color: "rgba(234,230,210,0.85)",
                  fontSize: "9px",
                  zIndex: 5 - i,
                }}
              >
                {initial}
              </div>
            ))}
          </div>
          <p className="text-lff-cream/50 text-xs font-medium tracking-wide">
            Joined by <span className="text-lff-cream/80 font-bold">100+ athletes</span> world-wide
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
