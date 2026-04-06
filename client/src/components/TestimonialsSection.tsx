/**
 * Testimonials — Styled as authentic Google review cards
 * Real reviews from Lover Fighter Fitness (5.0 ★ · 16 reviews)
 */
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import AnimatedTestimonials from "./AnimatedTestimonials";

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

const reviews: Review[] = [
  {
    name: "Ruby Frang",
    initials: "RF",
    avatarColor: "#AD1457",
    date: "1 hour ago",
    reviewCount: 1,
    quote:
      "Being coached by Levi has completely transformed my life. He has helped me unlock a version of myself I was searching for. Having him as my coach through all seasons of life has improved both my physical and mental health tremendously. However, his coaching services, specifically as a prep coach, is where I was able to unlock my potential. He not only supported and encouraged me to follow my dream of competing, but he coached me to a physique I felt incredibly proud of on stage. He is extremely personable and has helped me work on my confidence on and off of the bodybuilding stage. His attention to detail in his programming and his nutritional advice helped me rebuild a healthier relationship with food and training. There is truly no other coach I would ever consider working with. I have achieved more in my short time working with Levi than I ever had in the years I had been going to the gym. Truly a one of a kind coach that impacts all aspects of your life. To say he has changed my life would be an understatement. My journey with Levi has been not only transformative but so much fun. As I approach my second bodybuilding show with Levi, I am filled with excitement but also extreme gratitude for the work Levi has put in. His coaching is truly the best investment I have ever made.",
    photos: {
      before: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/ruby-transformation_acc0f9fd.jpeg",
      after: "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/ruby-comp-day_e2742a4b.jpeg",
      label: "3 Month Transformation · Comp Day",
    },
  },
  {
    name: "Kim Morrison",
    initials: "KM",
    avatarColor: "#7B5EA7",
    date: "30 minutes ago",
    reviewCount: 3,
    quote:
      "Since starting my PT sessions with Levi, I have gained so much confidence, self respect and incredible knowledge around my daily food intake and how my body works. Levi is genuinely interested in helping people become healthier, stronger not just physically but mentally. He is incredibly knowledgeable and extremely passionate about his job and helping his clients reach goals. Levi doesn't just show you how to work out or use equipment but he gives you the information you require to understand how and why you are doing a particular exercise which has helped me so much more than I ever expected. I highly recommend Lover Fighter Fitness and Levi to be your PT — you will not be disappointed!",
  },
  {
    name: "Ari Jackson",
    initials: "AJ",
    avatarColor: "#2E7D32",
    date: "2 weeks ago",
    reviewCount: 11,
    quote:
      "Levi is an incredibly dedicated and knowledgeable personal trainer. He provides his clients with the utmost care and support and is an amazing guy to chat with during a session. Highly recommend for anyone looking to get into bodybuilding, or simply taking the first step in their fitness journey.",
  },
  {
    name: "Hamish Johnson",
    initials: "HJ",
    avatarColor: "#1565C0",
    date: "a week ago",
    reviewCount: 7,
    quote:
      "Cannot recommend enough. I've learnt more about technique in a 1 hour session with Levi than over a year just mucking around at home. He's super knowledgeable, very patient, and has really helped me dial in the fundamentals. Absolute top tier Personal trainer 💪",
  },
  {
    name: "Leigh Hill",
    initials: "LH",
    avatarColor: "#C62828",
    date: "a year ago",
    isLocalGuide: true,
    reviewCount: 43,
    quote:
      "Levi has made a positive influence on my lifestyle change and is a very supportive, passionate and knowledgeable trainer. He has a great understanding of Hypertrophy and is able to communicate complex ideas easily to translate into results.",
  },
  {
    name: "Laura Koerbin",
    initials: "LK",
    avatarColor: "#00796B",
    date: "10 Jul 2024",
    isLocalGuide: true,
    reviewCount: 25,
    quote:
      "I've had Levi as a coach for about 9 months now, and it's probably the best thing I've ever done for my strength and health. I have learned far more than I ever expected and gained strength in ways I've never seen in my body before. Levi is extremely approachable and friendly, knowledgeable of all sorts of intricacies of weightlifting/powerlifting, and is so encouraging of your training no matter what level you're at. I see Levi once a week and also utilise his online coaching app, which is great for keeping me on track and has some really great features to make sure every session at the gym is maximised. Levi has completely changed my approach to the gym and working out, and fosters a really great learning environment with plenty of positive reinforcement to help you get better with every session. I'm far more confident and excited about visiting the gym now, and have had so many new PRs under Levi's coaching. I highly recommend Lover Fighter Fitness to anyone of any background, age, or experience level — he is so clearly passionate about fitness and strength and has so much to offer his clients.",
  },
];

// Google 'G' logo SVG
function GoogleLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function StarRating({ count = 5, size = 13 }: { count?: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={size} style={{ color: "#FBBC05" }} fill="#FBBC05" />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="results" className="grain-overlay relative py-24 md:py-32" style={{ backgroundColor: '#54412F' }}>
      <div className="container">
        <div className="border-t-2 border-lff-cream/15 mb-20" />

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="mb-16 md:mb-20"
        >
          <p className="text-lff-cream/55 text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Client Results
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide text-lff-cream leading-[0.95]">
            REAL PEOPLE.
            <br />
            REAL RESULTS.
          </h2>
          {/* Google aggregate rating */}
          <div className="flex items-center gap-3 mt-6">
            <GoogleLogo size={20} />
            <StarRating size={15} />
            <span className="text-lff-cream/80 text-base font-semibold">5.0</span>
            <span className="text-lff-cream/55 text-base font-normal">· 16 reviews on Google</span>
          </div>
        </motion.div>

        {/* Animated Testimonials */}
        <AnimatedTestimonials autoplay />

        {/* Original grid hidden for reference */}
        <div className="hidden">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { type: "spring", stiffness: 320, damping: 22 },
              }}
              className="flex flex-col p-6 rounded-2xl transition-colors duration-300 cursor-default group"
              style={{
                backgroundColor: 'rgba(234, 230, 210, 0.07)',
                border: '2px solid rgba(234, 230, 210, 0.20)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.border = '2px solid rgba(234,230,210,0.45)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(234,230,210,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.border = '2px solid rgba(234,230,210,0.20)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* Card Header — avatar + name + Google logo */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar with initials */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: review.avatarColor }}
                  >
                    {review.initials}
                  </div>
                  <div>
                    <p className="text-lff-cream font-semibold text-sm leading-tight">{review.name}</p>
                    <p className="text-lff-cream/45 text-xs font-normal mt-0.5">
                      {review.isLocalGuide && "Local Guide · "}
                      {review.reviewCount} review{review.reviewCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {/* Google logo top-right */}
                <GoogleLogo size={18} />
              </div>

              {/* Stars + date */}
              <div className="flex items-center gap-2 mb-3">
                <StarRating size={13} />
                <span className="text-lff-cream/45 text-xs font-normal">{review.date}</span>
              </div>

              {/* Review text */}
              <p className="text-lff-cream/80 text-sm leading-relaxed font-normal flex-1">
                {review.quote}
              </p>

              {/* Transformation photos — side by side */}
              {review.photos && (
                <div className="mt-5">
                  <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                    <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '3/4' }}>
                      <img
                        src={review.photos.before}
                        alt="Before transformation"
                        className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '3/4' }}>
                      <img
                        src={review.photos.after}
                        alt="After transformation"
                        className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  </div>
                  {review.photos.label && (
                    <p className="text-lff-cream/40 text-xs text-center mt-2 tracking-wider uppercase">
                      {review.photos.label}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* View all on Google CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex justify-center"
        >
          <a
            href="https://www.google.com/maps/place/Lover+Fighter+Fitness/@-32.205415,136.1073692,4z/data=!3m1!4b1!4m6!3m5!1s0x84dd2e080b71e77b:0x18cc80712c9fb90e!8m2!3d-32.205415!4d136.1073692!16s%2Fg%2F11y55s52bh?entry=ttu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-lff-cream/55 text-sm font-normal hover:text-lff-cream/80 transition-colors"
          >
            <GoogleLogo size={14} />
            View all reviews on Google
            <span className="text-lff-cream/30">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
