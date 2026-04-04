/**
 * LFF Navbar — Minimal, scroll-triggered logo reveal (centered)
 * - No hamburger menu on any screen size
 * - Instagram + Calculator icons always visible
 * - Logo starts hidden, fades in as you scroll
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Instagram, Calculator } from "lucide-react";

const LOGO_TRANSPARENT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [logoOpacity, setLogoOpacity] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const scrollThreshold = 60;

      setScrolled(scrollY > scrollThreshold);

      // Logo fades in as user scrolls past hero
      const logoFadeStart = 300;
      const logoFadeEnd = 600;
      const opacity = Math.max(0, Math.min(1, (scrollY - logoFadeStart) / (logoFadeEnd - logoFadeStart)));
      setLogoOpacity(opacity);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b-2 border-white/15 backdrop-blur-md" : ""
      }`}
      style={{ backgroundColor: scrolled ? "rgba(84,65,47,0.95)" : "transparent" }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Left — Instagram icon (always visible) */}
          <div className="flex items-center" style={{ flex: 1 }}>
            <a
              href="https://www.instagram.com/loverfighterfitness/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(234,230,210,0.55)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#EAE6D2")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(234,230,210,0.55)")}
              className="transition-colors duration-300"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
          </div>

          {/* Center — Logo (scroll-triggered reveal) */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              className="flex items-center justify-center"
              style={{
                opacity: logoOpacity,
                pointerEvents: logoOpacity > 0.1 ? "auto" : "none",
              }}
            >
              <a href="/" className="flex items-center justify-center">
                <img
                  src={LOGO_TRANSPARENT}
                  alt="Lover Fighter Fitness"
                  className="w-auto object-contain"
                  style={{ height: "80px" }}
                />
              </a>
            </motion.div>
          </div>

          {/* Right — Calculator icon (always visible) */}
          <div className="flex items-center justify-end gap-4" style={{ flex: 1 }}>
            <a
              href="/calculator"
              className="transition-colors duration-300"
              style={{ color: "rgba(234,230,210,0.55)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#EAE6D2")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(234,230,210,0.55)")}
              aria-label="Macro Calculator"
            >
              <Calculator size={20} />
            </a>
          </div>

        </div>
      </div>
    </nav>
  );
}
