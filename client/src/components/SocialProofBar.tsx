/**
 * Social Proof Bar — Single rotating statement, fades in/holds/fades out
 * Clean, premium. One truth at a time.
 */
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STATEMENTS = [
  "Ruby placed 2nd in her first ever comp",
  "5.0★ rated on Google",
  "Kim dropped 2 dress sizes in 4 months",
  "100+ athletes coached world-wide",
  "Competition prep specialist",
  "Custom programs — built for you",
];

const HOLD_DURATION = 3200; // ms visible
const TRANSITION_DURATION = 0.55; // seconds for fade

export default function SocialProofBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % STATEMENTS.length);
    }, HOLD_DURATION + TRANSITION_DURATION * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="py-5 flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#54412F",
        borderTop: "1px solid rgba(234,230,210,0.08)",
        borderBottom: "1px solid rgba(234,230,210,0.08)",
        minHeight: "52px",
      }}
      aria-live="polite"
      aria-label="Client wins and trust signals"
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: TRANSITION_DURATION, ease: "easeInOut" }}
          className="text-sm font-semibold tracking-wide text-center px-6"
          style={{ color: "rgba(234,230,210,0.70)", letterSpacing: "0.06em" }}
        >
          {STATEMENTS[index]}
        </motion.p>
      </AnimatePresence>
    </section>
  );
}
