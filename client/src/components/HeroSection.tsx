/**
 * Hero Section — Asymmetric split-screen layout
 * Left: text + CTAs  |  Right: hero image
 * Text scramble decode on headline, spring physics on CTAs
 */
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/DSC00890_1144300a.JPG";

export default function HeroSection() {
  return (
    <section
      className="grain-overlay relative min-h-[100dvh] flex items-center overflow-hidden"
      style={{ backgroundColor: "#54412F" }}
    >
      {/* ─── Layout: text left, image right ─── */}
      <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-center py-24 lg:py-0">

        {/* ─── LEFT: Content — centered on mobile, left-aligned on desktop ─── */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:pr-12 xl:pr-20 pt-8 lg:pt-0">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
            className="mb-8 md:mb-10"
          >
            <AnimatedLogo className="h-20 sm:h-24 md:h-28 w-auto" />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
            className="text-lff-cream/50 text-xs tracking-[0.35em] uppercase mb-6 font-medium"
          >
            Online Coaching · World-Wide
          </motion.p>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.5 }}
            className="mb-6 w-full"
          >
            <span
              className="block font-display leading-[0.92] tracking-wide text-lff-cream text-center lg:text-left"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 900 }}
            >
              COACHING BUILT
            </span>
            <span
              className="block leading-[1.05] text-center lg:text-left"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "clamp(3rem, 8vw, 7rem)",
                color: "#EAE6D2",
                opacity: 0.88,
              }}
            >
              For You.
            </span>
          </motion.div>

          {/* Thin rule */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="w-20 mb-6 origin-center lg:origin-left mx-auto lg:mx-0"
            style={{ height: "1.5px", backgroundColor: "rgba(234,230,210,0.35)" }}
          />

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 1.4 }}
            className="text-lff-cream/70 text-base md:text-lg max-w-md leading-relaxed mb-8 font-normal mx-auto lg:mx-0"
          >
            Personalised strength, bodybuilding, and competition prep coaching.
            Custom programming, weekly check-ins, real results.
          </motion.p>

          {/* CTAs — spring physics */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 1.6 }}
            className="flex flex-col items-center lg:items-start gap-3 mb-8"
          >
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {/* Primary */}
              <motion.a
                href="#coaching"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97, y: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="px-8 py-3.5 bg-lff-cream text-lff-brown font-bold tracking-wider uppercase text-sm rounded-full shadow-lg"
                style={{ willChange: "transform" }}
              >
                See The Coaching
              </motion.a>
              {/* Secondary */}
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97, y: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="px-7 py-3.5 border-2 border-lff-cream/30 text-lff-cream/65 font-semibold tracking-wider uppercase text-sm rounded-full"
                style={{ willChange: "transform" }}
              >
                Book a Call
              </motion.a>
            </div>
            {/* Risk reversal */}
            <p className="text-lff-cream/40 text-xs tracking-wide font-medium">
              No lock-in contracts · Cancel anytime
            </p>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 w-full"
          >
            {/* Avatar stack */}
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
                  style={{ borderColor: "rgba(234,230,210,0.30)", zIndex: 5 - i }}
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
            <p className="text-lff-cream/50 text-xs font-medium tracking-wide flex items-center gap-1.5">
              <span className="text-yellow-400/90 tracking-tight">★★★★★</span>
              <span className="text-lff-cream/75 font-bold">5.0</span>
              <span>·</span>
              <span>16 Google reviews</span>
            </p>
          </motion.div>
        </div>

        {/* ─── RIGHT: Hero image ─── */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.4 }}
          className="relative hidden lg:block"
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              aspectRatio: "3/4",
              maxHeight: "85vh",
              boxShadow: "0 40px 100px rgba(0,0,0,0.4), 0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            <img
              src={HERO_IMAGE}
              alt="Levi Hurst — Lover Fighter Fitness"
              className="w-full h-full object-cover object-top"
              draggable={false}
            />
            {/* Gradient fade into background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to right, rgba(84,65,47,0.3) 0%, transparent 30%), linear-gradient(to top, rgba(84,65,47,0.5) 0%, transparent 25%)",
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator — centered below both columns */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-lff-cream/25 text-xs tracking-[0.3em] uppercase font-medium">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={18} className="text-lff-cream/20" />
        </motion.div>
      </motion.div>
    </section>
  );
}
