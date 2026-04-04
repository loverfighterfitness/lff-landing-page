/**
 * Floating CTA — Minimal pill style, single brown
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2 } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

export default function FloatingCTA() {
  const [visible, setVisible] = useState(false);
  const { checkout, loading } = useStripeCheckout();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
        >
          {/* Main CTA */}
          <motion.button
            onClick={() => checkout("standardCoaching")}
            disabled={loading === "standardCoaching"}
            whileHover={!loading ? { scale: 1.08 } : undefined}
            whileTap={!loading ? { scale: 0.96 } : undefined}
            className="px-6 py-2.5 bg-lff-cream text-lff-brown font-bold text-xs tracking-widest uppercase rounded-full shadow-lg shadow-black/20 transition-all duration-300 btn-shimmer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading === "standardCoaching" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              "Start Now"
            )}
          </motion.button>

          {/* Back to top */}
          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 flex items-center justify-center border-2 border-lff-cream/35 rounded-full text-lff-cream/40 hover:text-lff-cream/70 hover:border-lff-cream/55 transition-all duration-300"
            style={{ backgroundColor: '#54412F' }}
            aria-label="Back to top"
          >
            <ArrowUp size={14} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
