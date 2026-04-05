/**
 * Home Page — Lover Fighter Fitness Landing Page
 * Design: Modern Athletic — Pure Brown & Cream
 * Dark-mode dominant, softer modern tone
 * Sections: Hero (VSL) → Why LFF → Coaching Packages → Testimonials → About → Contact → Footer
 */
import { useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofBar from "@/components/SocialProofBar";
import WhySection from "@/components/WhySection";
import CoachingSection from "@/components/CoachingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BeforeAfterSection from "@/components/BeforeAfterSection";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import FloatingMobileCTA from "@/components/FloatingMobileCTA";
import StatsSection from "@/components/StatsSection";
import FAQSection from "@/components/FAQSection";

export default function Home() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Cursor spotlight — subtle cream halo follows mouse
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (reduceMotion || isTouch) return;

    let rafId = 0;
    const onMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const el = spotlightRef.current;
        if (el) {
          el.style.transform = `translate3d(${e.clientX - 250}px, ${e.clientY - 250}px, 0)`;
          el.style.opacity = "1";
        }
        rafId = 0;
      });
    };
    const onLeave = () => {
      if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-lff-dark text-lff-cream">
      {/* Cursor spotlight */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[5] opacity-0 transition-opacity duration-300"
        style={{
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(234,230,210,0.12) 0%, rgba(234,230,210,0.06) 30%, transparent 65%)",
          mixBlendMode: "screen",
          willChange: "transform",
        }}
      />
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <StatsSection />
      <AboutSection />
      <WhySection />
      <CoachingSection />
      <BeforeAfterSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
      <FloatingMobileCTA />
    </div>
  );
}
