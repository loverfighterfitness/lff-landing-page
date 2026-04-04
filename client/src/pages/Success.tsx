/**
 * Success Page — Shown after Stripe checkout completes
 * Confirms payment, directs client to check email for HubFit link
 */
import { motion } from "framer-motion";
import { CheckCircle2, Instagram, ArrowLeft, Mail } from "lucide-react";
import { useEffect, useState } from "react";

const LOGO_TRANSPARENT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

const packageNames: Record<string, string> = {
  standardCoaching: "Online Coaching",
  compPrepCoaching: "Comp Prep Coaching",
};

export default function Success() {
  const [packageName, setPackageName] = useState("Online Coaching");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pkg = params.get("package");
    if (pkg && packageNames[pkg]) {
      setPackageName(packageNames[pkg]);
    }
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#54412F" }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <a href="/">
          <img
            src={LOGO_TRANSPARENT}
            alt="Lover Fighter Fitness"
            className="h-20 w-auto object-contain"
          />
        </a>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.15 }}
        className="w-full max-w-lg rounded-3xl px-10 py-12 text-center"
        style={{
          backgroundColor: "#EAE6D2",
          boxShadow: "0 24px 70px rgba(0,0,0,0.30), 0 4px 18px rgba(0,0,0,0.16)",
        }}
      >
        {/* Check icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
          className="flex justify-center mb-6"
        >
          <CheckCircle2
            size={64}
            strokeWidth={1.5}
            style={{ color: "#54412F" }}
          />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <p
            className="text-xs font-black tracking-[0.25em] uppercase mb-3"
            style={{ color: "rgba(84,65,47,0.50)" }}
          >
            Payment Confirmed
          </p>
          <h1
            className="font-display leading-tight mb-4"
            style={{
              color: "#54412F",
              fontSize: "clamp(2rem, 6vw, 3rem)",
              fontWeight: 900,
            }}
          >
            YOU'RE IN.
          </h1>
          <p
            className="text-base font-semibold leading-relaxed mb-8"
            style={{ color: "rgba(84,65,47,0.70)" }}
          >
            Welcome to <strong style={{ color: "#54412F" }}>{packageName}</strong>. Your coaching journey starts now.
          </p>
        </motion.div>

        {/* Email CTA — primary action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="rounded-2xl p-6 mb-6 text-left"
          style={{ backgroundColor: "#54412F" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Mail size={20} style={{ color: "#EAE6D2" }} />
            <p
              className="text-sm font-black tracking-[0.15em] uppercase"
              style={{ color: "#EAE6D2" }}
            >
              Check Your Email
            </p>
          </div>
          <p
            className="text-sm font-semibold leading-relaxed"
            style={{ color: "rgba(234,230,210,0.75)" }}
          >
            An email is on its way with your <strong style={{ color: "#EAE6D2" }}>HubFit download link</strong> and everything you need to get set up. Check your inbox (and spam just in case).
          </p>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="rounded-2xl p-6 mb-8 text-left"
          style={{ backgroundColor: "rgba(84,65,47,0.08)" }}
        >
          <p
            className="text-xs font-black tracking-[0.2em] uppercase mb-4"
            style={{ color: "rgba(84,65,47,0.50)" }}
          >
            What happens next
          </p>
          <ul className="space-y-3">
            {[
              "Download HubFit from the link in your email",
              "Levi will reach out within 24 hours",
              "Your custom program gets built",
              "Weekly check-ins begin — let's get to work",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                  style={{ backgroundColor: "#54412F", color: "#EAE6D2" }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "rgba(84,65,47,0.80)" }}
                >
                  {step}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Instagram + back links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="space-y-3"
        >
          <a
            href="https://www.instagram.com/loverfighterfitness/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-black text-sm tracking-widest uppercase transition-all duration-300 hover:opacity-85"
            style={{ backgroundColor: "#54412F", color: "#EAE6D2" }}
          >
            <Instagram size={16} />
            Follow @loverfighterfitness
          </a>
          <a
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-bold text-sm tracking-wide transition-all duration-300 hover:opacity-70"
            style={{ color: "rgba(84,65,47,0.50)" }}
          >
            <ArrowLeft size={14} />
            Back to site
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
