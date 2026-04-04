/**
 * Home Page — Lover Fighter Fitness Landing Page
 * Design: Modern Athletic — Pure Brown & Cream
 * Dark-mode dominant, softer modern tone
 * Sections: Hero (VSL) → Why LFF → Coaching Packages → Testimonials → About → Contact → Footer
 */
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
