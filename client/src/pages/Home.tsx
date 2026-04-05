/**
 * Home Page — Lover Fighter Fitness Landing Page
 * Design: Modern Athletic — Pure Brown & Cream
 * Dark-mode dominant, softer modern tone
 * Sections: Hero (VSL) → Why LFF → Coaching Packages → Testimonials → About → Contact → Footer
 */
import { useEffect } from "react";
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
  // Parallax grain — shifts subtly with cursor for gritty premium feel
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let rafId = 0;
    const onMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 60; // ±30px drift
        const y = (e.clientY / window.innerHeight - 0.5) * 60;
        document.documentElement.style.setProperty("--grain-x", `${x}px`);
        document.documentElement.style.setProperty("--grain-y", `${y}px`);
        rafId = 0;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-lff-dark text-lff-cream">
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
