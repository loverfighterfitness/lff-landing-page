/**
 * Pricing Interaction — adapted from ln-dev7 / 21st.dev for LFF
 * Sliding border highlight tracks selected plan
 * Animated price numbers via @number-flow/react
 * LFF brown/cream palette, hooks into Stripe checkout
 */
import NumberFlow from "@number-flow/react";
import { useState } from "react";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useStripeCheckout, type ProductKey } from "@/hooks/useStripeCheckout";

const PLANS = [
  {
    key: "standardCoaching" as ProductKey,
    name: "Online Coaching",
    tagline: "Full-service coaching, anywhere in the world",
    pricePerWeek: 80,
    priceNote: "/ week · less than $12 a day",
    badge: null,
    features: [
      "Custom training program",
      "Workout & nutrition tracker",
      "Cookbook access",
      "Weekly check-ins",
      "Video form reviews",
      "Unlimited message support",
    ],
  },
  {
    key: "compPrepCoaching" as ProductKey,
    name: "Comp Prep Coaching",
    tagline: "Everything you need to step on stage",
    pricePerWeek: 120,
    priceNote: "/ week · less than $18 a day",
    badge: "Get Stage Ready",
    features: [
      "Everything in Online Coaching",
      "Initial consult — classes & federations",
      "In-depth calorie & nutrition coaching",
      "Show day coaching & support",
      "Posing advice & feedback",
      "Full comp prep strategy",
    ],
  },
];

const CARD_HEIGHT = 96; // px — height of each plan row
const CARD_GAP = 12;   // px — gap between rows

export default function PricingInteraction() {
  const [active, setActive] = useState(0);
  const { checkout, loading } = useStripeCheckout();

  const selectedPlan = PLANS[active];

  return (
    <div
      className="rounded-3xl px-8 py-12 md:px-14 md:py-14 max-w-4xl mx-auto"
      style={{
        backgroundColor: "#EAE6D2",
        boxShadow: "0 24px 70px rgba(0,0,0,0.30), 0 4px 18px rgba(0,0,0,0.16)",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mb-10 text-center"
      >
        <p className="text-xs tracking-[0.3em] uppercase mb-4 font-black" style={{ color: "rgba(84,65,47,0.50)" }}>
          Online Coaching Packages
        </p>
        <h2
          className="font-display leading-[0.92] mb-4"
          style={{ color: "#54412F", fontSize: "clamp(2.4rem, 6vw, 4rem)", fontWeight: 900 }}
        >
          SERIOUS COACHING.
          <br />
          <span style={{ color: "rgba(84,65,47,0.45)" }}>REAL RESULTS.</span>
        </h2>
        <p className="max-w-md mx-auto text-base font-semibold leading-relaxed" style={{ color: "rgba(84,65,47,0.60)" }}>
          No upsells, no lock-in contracts. Pick your plan and start.
        </p>
      </motion.div>

      {/* Two-column layout: plan selector left, features right */}
      <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-start">

        {/* Left — interactive plan selector */}
        <div>
          <p className="text-xs tracking-[0.2em] uppercase font-black mb-4" style={{ color: "rgba(84,65,47,0.40)" }}>
            Choose your plan
          </p>

          <div className="relative flex flex-col gap-3">
            {PLANS.map((plan, i) => (
              <button
                key={plan.key}
                onClick={() => setActive(i)}
                className="w-full flex justify-between items-center p-5 rounded-2xl text-left transition-colors duration-200 cursor-pointer"
                style={{
                  border: "2px solid rgba(84,65,47,0.18)",
                  background: "transparent",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base" style={{ color: "#54412F" }}>
                      {plan.name}
                    </span>
                    {plan.badge && (
                      <span
                        className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#54412F", color: "#EAE6D2" }}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "rgba(84,65,47,0.55)" }}>
                    {plan.tagline}
                  </span>
                </div>

                {/* Radio circle */}
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ml-4 transition-all duration-300"
                  style={{ borderColor: active === i ? "#54412F" : "rgba(84,65,47,0.30)" }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: "#54412F",
                      opacity: active === i ? 1 : 0,
                      transform: active === i ? "scale(1)" : "scale(0)",
                    }}
                  />
                </div>
              </button>
            ))}

            {/* Sliding border highlight */}
            <div
              className="absolute left-0 right-0 rounded-2xl pointer-events-none"
              style={{
                border: "3px solid #54412F",
                height: `${CARD_HEIGHT}px`,
                top: `${active * (CARD_HEIGHT + CARD_GAP)}px`,
                transition: "top 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 0 0 4px rgba(84,65,47,0.08)",
              }}
            />
          </div>

          {/* Animated price */}
          <div className="mt-8 pl-1">
            <div className="flex items-end gap-1 leading-none">
              <span
                className="font-display font-black"
                style={{ color: "#54412F", fontSize: "clamp(3.5rem, 8vw, 5rem)", lineHeight: 0.9 }}
              >
                $<NumberFlow value={selectedPlan.pricePerWeek} />
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: "rgba(84,65,47,0.50)" }}>
              {selectedPlan.priceNote}
            </p>
          </div>
        </div>

        {/* Right — features + CTA */}
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase font-black mb-4" style={{ color: "rgba(84,65,47,0.40)" }}>
              What's included
            </p>
            <motion.ul
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-3 mb-8"
            >
              {selectedPlan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check
                    size={15}
                    className="mt-0.5 shrink-0"
                    strokeWidth={3}
                    style={{ color: "#54412F" }}
                  />
                  <span className="text-sm font-semibold leading-relaxed" style={{ color: "rgba(84,65,47,0.85)" }}>
                    {feature}
                  </span>
                </li>
              ))}
            </motion.ul>
          </div>

          <div>
            <button
              onClick={() => checkout(selectedPlan.key)}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-2 py-4 font-black text-sm tracking-widest uppercase rounded-full transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.97]"
              style={{ backgroundColor: "#54412F", color: "#EAE6D2", boxShadow: "0 8px 24px rgba(84,65,47,0.30)" }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight size={15} />
                </>
              )}
            </button>
            <p className="text-center text-xs mt-3 font-medium" style={{ color: "rgba(84,65,47,0.40)" }}>
              4 week minimum · cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <p className="mt-10 text-xs font-semibold text-center" style={{ color: "rgba(84,65,47,0.38)" }}>
        All coaching is delivered online. Once you sign up, Levi will reach out within 24 hours to get you set up.
      </p>
    </div>
  );
}
