/**
 * Floating Mobile CTA — Modern slim pill, bottom-center
 * Appears on scroll, hides near pricing/contact. Scrolls to coaching on click.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function FloatingMobileCTA() {
  const [show, setShow] = useState(false);
  const [hideZone, setHideZone] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShow(scrollY > 700);

      const coaching = document.getElementById("coaching");
      const contact = document.getElementById("contact");
      if (coaching && contact) {
        const coachingTop = coaching.offsetTop - 200;
        const contactTop = contact.offsetTop - 400;
        // Hide when user is in coaching/pricing area OR near contact
        setHideZone(scrollY > coachingTop && scrollY < coachingTop + 1800 || scrollY > contactTop);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    const coaching = document.getElementById("coaching");
    coaching?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AnimatePresence>
      {show && !hideZone && (
        <motion.button
          onClick={handleClick}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="group fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 pl-5 pr-4 py-3 rounded-full cursor-pointer"
          style={{
            backgroundColor: "#EAE6D2",
            color: "#54412F",
            boxShadow: "0 8px 28px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.12)",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            backdropFilter: "blur(8px)",
          }}
        >
          <span>See Coaching</span>
          <motion.span
            className="flex items-center justify-center rounded-full"
            style={{ backgroundColor: "#54412F", color: "#EAE6D2", width: 26, height: 26 }}
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowRight size={14} strokeWidth={2.5} />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
