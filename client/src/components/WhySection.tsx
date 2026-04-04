/**
 * Why LFF — Single brown, minimal clean layout
 */
import { motion } from "framer-motion";
import { Target, Video, MessageCircle, TrendingUp } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Custom Programming",
    description:
      "Every program is built from scratch for you — your goals, your schedule, your equipment. No templates, no recycled plans.",
  },
  {
    icon: Video,
    title: "Video Form Reviews",
    description:
      "Submit your lifts and get detailed video feedback every week. It's like having a coach watching every set, from anywhere in the world.",
  },
  {
    icon: MessageCircle,
    title: "Unlimited Contact",
    description:
      "Direct access to me whenever you need it. Questions, check-ins, program tweaks — you're never left guessing.",
  },
  {
    icon: TrendingUp,
    title: "Nutrition & Tracking",
    description:
      "Full nutrition guidance and tracking through the app. Weekly check-ins keep you accountable and your progress on track.",
  },
];

export default function WhySection() {
  return (
    <section className="grain-overlay relative py-24 md:py-32" style={{ backgroundColor: '#54412F' }}>
      {/* Subtle divider line at top */}
      <div className="container">
        <div className="border-t-2 border-lff-cream/15 mb-20" />
      </div>

      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-20 max-w-xl"
        >
          <p className="text-lff-cream/55 text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            What You Get
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide text-lff-cream leading-[0.95]">
            ONLINE COACHING
            <br />
            THAT ACTUALLY WORKS
          </h2>
        </motion.div>

        {/* Value Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px border-2 border-lff-cream/15 rounded-2xl overflow-hidden">
          {values.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{
                y: -6,
                transition: { type: "spring", stiffness: 340, damping: 24 },
              }}
              className="p-8 md:p-10 border-r border-b border-lff-cream/10 last:border-r-0 [&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(4)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0 sm:[&:nth-child(1)]:border-b lg:[&:nth-child(1)]:border-b-0 sm:[&:nth-child(2)]:border-b lg:[&:nth-child(2)]:border-b-0 group cursor-default transition-colors duration-300"
              style={{ backgroundColor: '#54412F' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(234,230,210,0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#54412F';
              }}
            >
              <motion.div
                whileHover={{ scale: 1.35, rotate: 8, y: -4 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
                className="inline-block p-3 rounded-xl mb-6 transition-all duration-300 group-hover:bg-lff-cream/10"
              >
                <item.icon
                  size={40}
                  className="text-lff-cream/60 group-hover:text-lff-cream transition-all duration-300"
                  strokeWidth={1.1}
                />
              </motion.div>
              <h3 className="font-display text-xl tracking-wider text-lff-cream mb-3 group-hover:text-white transition-colors duration-300">
                {item.title.toUpperCase()}
              </h3>
              <p className="text-lff-cream/70 text-base leading-relaxed font-normal group-hover:text-lff-cream/85 transition-colors duration-300">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
