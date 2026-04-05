/**
 * Animated Testimonials — adapted from Aceternity UI for LFF
 * Stacked photo carousel on left, word-by-word quote reveal on right
 * Styled in LFF brown/cream palette
 */
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string; // photo URL or avatar URL
  avatarColor?: string;
  initials?: string;
  objectPosition?: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Being coached by Levi has completely transformed my life. He helped me unlock a version of myself I was searching for. His coaching through comp prep is where I unlocked my potential — he coached me to a physique I felt incredibly proud of on stage. There is truly no other coach I would ever consider working with.",
    name: "Ruby Frang",
    designation: "Comp Prep Client · 2× Show Competitor",
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/ruby-comp-day_e2742a4b.jpeg",
  },
  {
    quote:
      "Since starting with Levi, I have gained so much confidence, self respect and incredible knowledge. He is genuinely interested in helping people become healthier and stronger — not just physically but mentally. I highly recommend Lover Fighter Fitness.",
    name: "Kim Morrison",
    designation: "Online Coaching Client · 4 Months",
    src: "/transformations/kim-testimonial.jpg",
    objectPosition: "center 20%",
  },
  {
    quote:
      "I've had Levi as a coach for about 9 months now — probably the best thing I've ever done for my strength and health. I have learned far more than I ever expected and gained strength in ways I've never seen in my body before. I'm far more confident and excited about the gym now.",
    name: "Laura Koerbin",
    designation: "Online Coaching Client · 9 Months",
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/3364F913-BF35-4897-B42E-9359661B16E7_41a0bda7.jpeg",
  },
  {
    quote:
      "Cannot recommend enough. I've learnt more about technique in a 1 hour session with Levi than over a year just mucking around at home. He's super knowledgeable, very patient, and has really helped me dial in the fundamentals. Absolute top tier.",
    name: "Hamish Johnson",
    designation: "F2F PT Client",
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/440F56C7-42C7-4BEF-AA2B-04F320CCBC31_ddfd61dc.jpeg",
  },
  {
    quote:
      "Levi has made a positive influence on my lifestyle change. A very supportive, passionate and knowledgeable trainer. He has a great understanding of Hypertrophy and is able to communicate complex ideas easily to translate into real results.",
    name: "Leigh Hill",
    designation: "Online Coaching Client · -14kg",
    src: "/transformations/leigh-after.png",
    objectPosition: "15% 20%",
  },
];

export default function AnimatedTestimonials({ autoplay = true }: { autoplay?: boolean }) {
  const [active, setActive] = useState(0);

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [autoplay, handleNext]);

  const randomRotateY = () => Math.floor(Math.random() * 21) - 10;

  return (
    <div
      className="rounded-3xl px-8 py-12 md:px-14 md:py-14"
      style={{
        backgroundColor: "#EAE6D2",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

        {/* Left — stacked photo carousel */}
        <div className="relative h-72 md:h-96 w-full">
          <AnimatePresence>
            {TESTIMONIALS.map((t, index) => {
              const isActive = index === active;
              const distance = Math.min(
                Math.abs(index - active),
                Math.abs(index - active + TESTIMONIALS.length),
                Math.abs(index - active - TESTIMONIALS.length)
              );
              const showStack = distance <= 2;
              if (!isActive && !showStack) return null;
              return (
                <motion.div
                  key={t.src}
                  initial={{ opacity: 0, scale: 0.9, rotate: randomRotateY() }}
                  animate={{
                    opacity: isActive ? 1 : Math.max(0, 0.55 - (distance - 1) * 0.15),
                    scale: isActive ? 1 : 1 - distance * 0.04,
                    rotate: isActive ? 0 : randomRotateY(),
                    zIndex: isActive ? 10 : 10 - distance,
                    y: isActive ? [0, -12, 0] : distance * 6,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 origin-bottom"
                >
                  <img
                    src={t.src}
                    alt={t.name}
                    draggable={false}
                    className="h-full w-full rounded-2xl object-cover select-none"
                    style={{ boxShadow: isActive ? "0 16px 48px rgba(0,0,0,0.22)" : "none", objectPosition: t.objectPosition ?? "center top" }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right — quote + name + controls */}
        <div className="flex flex-col justify-between h-full py-2">
          <motion.div
            key={active}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Name + role */}
            <p
              className="text-xl md:text-2xl font-black tracking-wide mb-1"
              style={{ color: "#54412F" }}
            >
              {TESTIMONIALS[active].name}
            </p>
            <p
              className="text-xs tracking-[0.15em] uppercase font-semibold mb-8"
              style={{ color: "rgba(84,65,47,0.50)" }}
            >
              {TESTIMONIALS[active].designation}
            </p>

            {/* Word-by-word blur reveal */}
            <motion.p
              className="text-base md:text-lg leading-relaxed font-normal"
              style={{ color: "rgba(84,65,47,0.80)" }}
            >
              {TESTIMONIALS[active].quote.split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ filter: "blur(8px)", opacity: 0, y: 4 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut", delay: 0.015 * i }}
                  className="inline-block mr-1"
                >
                  {word}
                </motion.span>
              ))}
            </motion.p>
          </motion.div>

          {/* Nav buttons + dot indicators */}
          <div className="flex items-center gap-4 mt-10">
            <button
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 group"
              style={{ borderColor: "rgba(84,65,47,0.25)", color: "rgba(84,65,47,0.60)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#54412F"; (e.currentTarget as HTMLElement).style.color = "#54412F"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(84,65,47,0.25)"; (e.currentTarget as HTMLElement).style.color = "rgba(84,65,47,0.60)"; }}
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 group"
              style={{ borderColor: "rgba(84,65,47,0.25)", color: "rgba(84,65,47,0.60)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#54412F"; (e.currentTarget as HTMLElement).style.color = "#54412F"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(84,65,47,0.25)"; (e.currentTarget as HTMLElement).style.color = "rgba(84,65,47,0.60)"; }}
            >
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>

            {/* Dot indicators */}
            <div className="flex gap-1.5 ml-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === active ? "20px" : "6px",
                    height: "6px",
                    backgroundColor: i === active ? "#54412F" : "rgba(84,65,47,0.25)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
