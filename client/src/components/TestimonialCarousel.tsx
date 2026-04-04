/**
 * Testimonial Carousel — iOS-style drag-to-swipe with real-time finger tracking
 * Desktop: Shows 2 cards, Mobile: Shows 1 card with drag
 * Auto-advance only when carousel is in viewport (intersection observer)
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Review {
  name: string;
  initials: string;
  avatarColor: string;
  date: string;
  isLocalGuide?: boolean;
  reviewCount?: number;
  quote: string;
  photos?: { before: string; after: string; label?: string };
}

interface TestimonialCarouselProps {
  reviews: Review[];
}

function GoogleLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="2" y="18" fontSize="14" fontWeight="bold" fill="currentColor">
        G
      </text>
    </svg>
  );
}

function StarRating({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 15.09,10.26 24,10.26 17.55,16.74 19.64,25 12,19.52 4.36,25 6.45,16.74 0,10.26 8.91,10.26" />
    </svg>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className="flex flex-col p-6 rounded-2xl transition-colors duration-300 cursor-default group flex-shrink-0 w-full overflow-hidden"
      style={{
        backgroundColor: 'rgba(234, 230, 210, 0.07)',
        border: '2px solid rgba(234, 230, 210, 0.20)',
      }}
    >
      {/* Header: Avatar + Name + Date */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: review.avatarColor }}
        >
          {review.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-lff-cream text-sm">{review.name}</h4>
            {review.isLocalGuide && (
              <span className="text-xs bg-lff-cream/10 text-lff-cream/70 px-2 py-1 rounded-full whitespace-nowrap">
                Local Guide
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <StarRating key={i} size={12} />
              ))}
            </div>
            <span className="text-xs text-lff-cream/60">{review.date}</span>
          </div>
        </div>
      </div>

      {/* Quote */}
      <p className="text-lff-cream/80 text-sm leading-relaxed font-normal flex-1 line-clamp-4">
        {review.quote}
      </p>

      {/* Transformation photos */}
      {review.photos && (
        <div className="mt-6 -mx-6 -mb-6 px-6 pb-6 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3 rounded-xl overflow-visible mb-3">
            <img
              src={review.photos.before}
              alt="Before"
              className="w-full h-64 object-cover rounded-lg block"
            />
            <img
              src={review.photos.after}
              alt="After"
              className="w-full h-64 object-cover rounded-lg block"
            />
          </div>
          <p className="text-xs text-lff-cream/50 font-semibold">{review.photos.label}</p>
        </div>
      )}
    </div>
  );
}

export function TestimonialCarousel({ reviews }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Intersection Observer: Only auto-advance when carousel is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Auto-advance only when in view, with 10 second wait before starting
  useEffect(() => {
    if (!isInView) return;

    // Wait 10 seconds before starting auto-advance
    const initialDelay = setTimeout(() => {
      // Start auto-advance after initial delay
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 10000);

    return () => clearTimeout(initialDelay);
  }, [reviews.length, isInView]);



  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow swiping when carousel is in view
    if (!isInView) return;
    
    touchStartX.current = e.changedTouches[0].screenX;
    setIsDragging(true);
    setDragX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isInView) return;
    const currentX = e.changedTouches[0].screenX;
    const diff = currentX - touchStartX.current;
    setDragX(diff);
  };

  const handleTouchEnd = () => {
    if (!isInView) {
      setIsDragging(false);
      setDragX(0);
      return;
    }
    
    setIsDragging(false);
    // Swipe threshold: 50px
    if (Math.abs(dragX) > 50) {
      if (dragX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    setDragX(0);
  };

  const visibleReviews = isMobile
    ? [reviews[currentIndex]]
    : [
        reviews[currentIndex],
        reviews[(currentIndex + 1) % reviews.length],
      ];

  return (
    <div
      ref={containerRef}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel container */}
      <div className="overflow-hidden">
        <motion.div
          animate={{ x: isDragging ? dragX : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
          className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${isInView ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        >
          {visibleReviews.map((review, i) => (
            <ReviewCard key={`${currentIndex}-${i}`} review={review} />
          ))}
        </motion.div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-8">
        {reviews.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => {
              setCurrentIndex(i);
            }}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                i === currentIndex
                  ? 'rgba(234, 230, 210, 0.8)'
                  : 'rgba(234, 230, 210, 0.25)',
            }}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>

      {/* Navigation arrows — hidden on mobile */}
      <div className="hidden md:flex justify-center gap-4 mt-6">
        <motion.button
          onClick={handlePrev}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full border-2 border-lff-cream/30 text-lff-cream/60 hover:text-lff-cream/80 hover:border-lff-cream/50 transition-all duration-300"
        >
          <ChevronLeft size={20} />
        </motion.button>
        <motion.button
          onClick={handleNext}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full border-2 border-lff-cream/30 text-lff-cream/60 hover:text-lff-cream/80 hover:border-lff-cream/50 transition-all duration-300"
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* "Swipe to see more" hint on mobile */}
      {isMobile && (
        <p className="text-center text-xs text-lff-cream/40 mt-4 font-semibold">
          Swipe to see more
        </p>
      )}
    </div>
  );
}
