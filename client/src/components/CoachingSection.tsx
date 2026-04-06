/**
 * Coaching Packages — Maximum impact layout
 * Standard card: cream bg, brown text
 * Comp Prep card: full brown bg, cream text — inverted for drama
 * Desktop: 3D mouse-tracking tilt + scale + glow on hover
 * Mobile: Scroll-activated scale + glow
 */
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Check, ArrowRight, Zap, Star, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useStripeCheckout, type ProductKey } from "@/hooks/useStripeCheckout";

interface Package {
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  valueAnchor: string;
  features: string[];
  popular?: boolean;
  note?: string;
  productKey: ProductKey;
}

const packages: Package[] = [
  {
    name: "Online Coaching",
    tagline: "Full-service coaching, anywhere in the world",
    price: "$80",
    priceNote: "/ week",
    valueAnchor: "Less than $12 a day",
    features: [
      "Custom training program",
      "Workout tracker",
      "Nutrition tracker & advice",
      "Cookbook access",
      "Weekly check-ins",
      "Video form reviews & analysis",
      "Group chats & forums",
      "Unlimited message support",
    ],
    note: "4 week minimum · cancel anytime",
    productKey: "standardCoaching",
  },
  {
    name: "Comp Prep Coaching",
    tagline: "Everything you need to step on stage",
    price: "$120",
    priceNote: "/ week",
    valueAnchor: "Less than $18 a day",
    popular: true,
    features: [
      "Everything in Online Coaching, plus:",
      "Initial consult — classes & federations",
      "In-depth calorie & nutrition coaching",
      "Show day coaching & support",
      "In-depth weekly check-ins",
      "Posing advice & feedback",
      "Full comp guidance & prep strategy",
    ],
    note: "4 week minimum · cancel anytime",
    productKey: "compPrepCoaching",
  },
];

function useScrollFocus(ref: React.RefObject<HTMLDivElement | null>) {
  const [focus, setFocus] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const cardCenter = rect.top + rect.height / 2;
      const dist = Math.abs(cardCenter - vh / 2) / (rect.height * 0.9);
      setFocus(Math.max(0, 1 - dist));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [ref]);
  return focus;
}

function PackageCard({
  pkg,
  index,
  onCheckout,
  isLoading,
}: {
  pkg: Package;
  index: number;
  onCheckout: (key: ProductKey) => void;
  isLoading: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollFocus = useScrollFocus(cardRef);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), { stiffness: 300, damping: 28 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), { stiffness: 300, damping: 28 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => { setIsTouchDevice(window.matchMedia("(hover: none)").matches); }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    // Update spotlight CSS vars
    const el = cardRef.current;
    if (el) {
      el.style.setProperty("--spotlight-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--spotlight-y", `${e.clientY - rect.top}px`);
    }
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const mobileScale = 1 + scrollFocus * 0.05;
  const mobileGlow = isTouchDevice ? scrollFocus : 0;

  const isInverted = pkg.popular; // Comp prep = full brown bg, cream text

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay: index * 0.15 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isTouchDevice ? 0 : rotateX,
        rotateY: isTouchDevice ? 0 : rotateY,
        transformStyle: "preserve-3d",
        scale: isTouchDevice ? mobileScale : undefined,
        boxShadow: isTouchDevice
          ? `0 ${12 + mobileGlow * 48}px ${30 + mobileGlow * 70}px rgba(0,0,0,${0.15 + mobileGlow * 0.18})`
          : isInverted
            ? "0 8px 40px rgba(0,0,0,0.22)"
            : "0 4px 24px rgba(84,65,47,0.10)",
        backgroundColor: isInverted ? '#54412F' : '#EAE6D2',
      }}
      whileHover={
        !isTouchDevice
          ? {
              scale: 1.05,
              y: -18,
              boxShadow: isInverted
                ? "0 40px 100px rgba(0,0,0,0.35), 0 12px 40px rgba(0,0,0,0.22)"
                : "0 40px 100px rgba(84,65,47,0.20), 0 12px 40px rgba(84,65,47,0.14)",
              transition: { type: "spring", stiffness: 320, damping: 20 },
            }
          : undefined
      }
      className="relative flex flex-col p-8 md:p-10 rounded-2xl cursor-pointer group"
    >
      {/* Popular badge */}
      {pkg.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span
            className="px-5 py-1.5 text-xs font-black tracking-widest uppercase rounded-full flex items-center gap-1.5 whitespace-nowrap"
            style={{ backgroundColor: '#EAE6D2', color: '#54412F' }}
          >
            <Star size={10} fill="currentColor" />
            Get Stage Ready
            <Star size={10} fill="currentColor" />
          </span>
        </div>
      )}

      {/* Spotlight border — follows cursor */}
      <div
        className="absolute -inset-[1px] rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-0"
        style={{
          background: `radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${
            isInverted ? "rgba(234,230,210,0.15)" : "rgba(84,65,47,0.12)"
          }, transparent 40%)`,
        }}
      />
      {/* Shimmer overlay on hover (desktop) */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: isInverted
              ? "linear-gradient(105deg, transparent 35%, rgba(234,230,210,0.06) 50%, transparent 65%)"
              : "linear-gradient(105deg, transparent 35%, rgba(84,65,47,0.05) 50%, transparent 65%)",
            animation: "shimmer-sweep 1.4s ease-in-out infinite",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col flex-1">

        {/* Package name */}
        <p
          className="text-xs font-black tracking-[0.25em] uppercase mb-2"
          style={{ color: isInverted ? 'rgba(234,230,210,0.55)' : 'rgba(84,65,47,0.50)' }}
        >
          {pkg.name}
        </p>

        {/* Tagline */}
        <h3
          className="font-display leading-tight mb-8"
          style={{
            color: isInverted ? '#EAE6D2' : '#54412F',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
          }}
        >
          {pkg.tagline}
        </h3>

        {/* Price — the hero */}
        <div className="mb-2">
          <div className="flex items-end gap-2 leading-none">
            <span
              className="font-display group-hover:scale-105 inline-block transition-transform duration-300 origin-left"
              style={{
                color: isInverted ? '#EAE6D2' : '#54412F',
                fontSize: 'clamp(5rem, 10vw, 7rem)',
                fontWeight: 900,
                lineHeight: 0.9,
              }}
            >
              {pkg.price}
            </span>
            <span
              className="text-xl font-bold pb-2"
              style={{ color: isInverted ? 'rgba(234,230,210,0.60)' : 'rgba(84,65,47,0.55)' }}
            >
              {pkg.priceNote}
            </span>
          </div>
        </div>

        {/* Value anchor */}
        <p
          className="text-sm font-black tracking-wide uppercase mb-8"
          style={{ color: isInverted ? 'rgba(234,230,210,0.50)' : 'rgba(84,65,47,0.45)' }}
        >
          {pkg.valueAnchor}
        </p>

        {/* Features */}
        <ul className="flex-1 space-y-3.5 mb-8">
          {pkg.features.map((feature, j) => (
            <motion.li
              key={j}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 100, damping: 18, delay: index * 0.1 + j * 0.05 }}
            >
              <Check
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: isInverted ? '#EAE6D2' : '#54412F' }}
                strokeWidth={3}
              />
              <span
                className="text-base font-semibold leading-relaxed"
                style={{ color: isInverted ? 'rgba(234,230,210,0.90)' : '#54412F' }}
              >
                {feature}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* Note */}
        {pkg.note && (
          <p
            className="text-xs mb-6 font-semibold tracking-wide"
            style={{ color: isInverted ? 'rgba(234,230,210,0.40)' : 'rgba(84,65,47,0.40)' }}
          >
            *{pkg.note}
          </p>
        )}

        {/* CTA */}
        <motion.button
          onClick={() => onCheckout(pkg.productKey)}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.05, y: -2 } : undefined}
          whileTap={!isLoading ? { scale: 0.97, y: 1 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="flex items-center justify-center gap-2 py-4 font-black text-sm tracking-widest uppercase rounded-full transition-all duration-300 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
          style={isInverted
            ? { backgroundColor: '#EAE6D2', color: '#54412F' }
            : { backgroundColor: '#54412F', color: '#EAE6D2', boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }
          }
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              Get Started
              <motion.div
                animate={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <ArrowRight size={15} />
              </motion.div>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function CoachingSection() {
  const { checkout, loading } = useStripeCheckout();

  return (
    <section id="coaching" className="grain-overlay relative py-24 md:py-32" style={{ backgroundColor: '#54412F' }}>
      <div className="container">
        {/* Floating cream outer panel */}
        <div
          className="rounded-3xl px-8 py-14 md:px-14 md:py-16 max-w-4xl mx-auto"
          style={{
            backgroundColor: '#EAE6D2',
            boxShadow: '0 24px 70px rgba(0,0,0,0.30), 0 4px 18px rgba(0,0,0,0.16)',
          }}
        >
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="mb-16 md:mb-20 text-center"
          >
            <p className="text-xs tracking-[0.3em] uppercase mb-4 font-black" style={{ color: 'rgba(84,65,47,0.50)' }}>
              Online Coaching Packages
            </p>
            <h2
              className="font-display leading-[0.92] mb-4"
              style={{ color: '#54412F', fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 900 }}
            >
              SERIOUS COACHING.
              <br />
              <span style={{ color: 'rgba(84,65,47,0.55)' }}>REAL RESULTS.</span>
            </h2>
            <p className="max-w-lg mx-auto text-lg font-semibold leading-relaxed" style={{ color: 'rgba(84,65,47,0.65)' }}>
              No upsells, no lock-in contracts. Pick your package and start training with a plan built specifically for you.
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto" style={{ perspective: "1400px" }}>
            {packages.map((pkg, i) => (
              <PackageCard
                key={i}
                pkg={pkg}
                index={i}
                onCheckout={checkout}
                isLoading={loading === pkg.productKey}
              />
            ))}
          </div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 text-sm font-semibold max-w-3xl mx-auto text-center"
            style={{ color: 'rgba(84,65,47,0.45)' }}
          >
            All coaching is delivered online. Once you sign up, Levi will reach out within 24 hours to get you set up and started.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
