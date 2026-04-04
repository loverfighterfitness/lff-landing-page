/**
 * Floating Mobile CTA — Landscape cream bubble with dynamic rotating text
 * Appears on scroll, disappears when near contact section
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

const dynamicTexts = [
  "Get Started",
  "Start Coaching",
  "Transform Now",
  "Begin Your Journey",
  "Work With Levi",
];

export default function FloatingMobileCTA() {
  const [show, setShow] = useState(false);
  const [nearContact, setNearContact] = useState(false);
  const [overResults, setOverResults] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const { checkout, loading } = useStripeCheckout();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const contactSection = document.getElementById("contact");
      setShow(scrollY > 900);
      if (contactSection) {
        setNearContact(scrollY > contactSection.offsetTop - 300);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide when the before/after results section is visible
  useEffect(() => {
    const resultsSection = Array.from(document.querySelectorAll("section")).find(
      (s) => s.textContent?.includes("THE PROOF")
    );
    if (!resultsSection) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOverResults(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(resultsSection);
    return () => observer.disconnect();
  }, []);

  // Rotate text every 3 seconds
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % dynamicTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [show]);

  return (
    <AnimatePresence>
      {show && !nearContact && !overResults && (
        <motion.button
          onClick={() => checkout("standardCoaching")}
          disabled={loading === "standardCoaching"}
          initial={{ opacity: 0, scale: 0.8, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 100 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
          whileHover={!loading ? { scale: 1.05 } : undefined}
          whileTap={!loading ? { scale: 0.95 } : undefined}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 md:hidden disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            width: "180px",
            height: "70px",
            borderRadius: "50px",
            backgroundColor: "#EAE6D2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)",
            cursor: "pointer",
          }}
        >
          {/* Rotating text landscape */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Rotating text */}
            <motion.div
              key={textIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center flex-1"
              style={{
                fontSize: "13px",
                fontWeight: "900",
                color: "#54412F",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                maxWidth: "160px",
                lineHeight: "1.2",
                textAlign: "center",
              }}
            >
              {loading === "standardCoaching" ? "Loading..." : dynamicTexts[textIndex]}
            </motion.div>
          </div>

          {/* Pulse animation ring */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50px",
              border: "2px solid #54412F",
              opacity: 0.3,
            }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
