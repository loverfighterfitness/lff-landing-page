/**
 * Contact / Lead Capture — phone number capture, "still not sure" tone
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

const GOAL_OPTIONS = [
  { value: "lose_weight", label: "Lose Weight / Tone Up" },
  { value: "build_muscle", label: "Build Muscle / Bulk" },
  { value: "comp_prep", label: "Competition Prep" },
  { value: "strength", label: "Strength / Powerlifting" },
  { value: "general_fitness", label: "General Fitness" },
  { value: "other", label: "Other" },
] as const;

type GoalValue = (typeof GOAL_OPTIONS)[number]["value"];

export default function ContactSection() {
  // This component is targeted by FloatingMobileCTA for scroll detection
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState<GoalValue | "">("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const submitLead = trpc.leads.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => {
      setErrors({ form: err.message || "Something went wrong. Please try again." });
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Enter your full name";
    if (!phone.trim() || phone.trim().length < 6) e.phone = "Enter a valid phone number";
    if (!goal) e.goal = "Select your primary goal";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    submitLead.mutate({
      name: name.trim(),
      phone: phone.trim(),
      goal: goal as GoalValue,
      message: message.trim() || undefined,
    });
  };

  const inputBase =
    "w-full bg-transparent border-2 rounded-xl px-4 py-3 text-sm font-light outline-none transition-all duration-200";
  const inputStyle = (field: string) =>
    `${inputBase} ${
      errors[field]
        ? "border-red-500/70 focus:border-red-500"
        : "focus:border-lff-brown/55"
    }`;
  const inputInlineStyle = (field: string): React.CSSProperties => ({
    borderColor: errors[field] ? 'rgba(239,68,68,0.7)' : 'rgba(84,65,47,0.25)',
    color: '#54412F',
  });

  return (
    <section id="contact" className="grain-overlay relative py-16 md:py-24" style={{ backgroundColor: '#54412F' }}>
      <div className="container">
        {/* Floating cream panel */}
        <div
          className="rounded-3xl px-8 py-14 md:px-14 md:py-16 max-w-xl mx-auto"
          style={{
            backgroundColor: '#EAE6D2',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-sm tracking-[0.3em] uppercase mb-4 font-medium" style={{ color: 'rgba(84,65,47,0.55)' }}>
              Not Sure Yet?
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide leading-[0.95] mb-4" style={{ color: '#54412F' }}>
              STILL NOT
              <br />
              SURE?
            </h2>
            <p className="text-base font-normal leading-relaxed max-w-sm mx-auto" style={{ color: 'rgba(84,65,47,0.75)' }}>
              Fill in your details and I'll reach out to see if we're the right fit.
              No pressure, no commitment.
            </p>
          </motion.div>

          {/* Form / Success */}
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-12 px-8 border-2 rounded-2xl"
                style={{ borderColor: 'rgba(84,65,47,0.25)' }}
              >
                <CheckCircle size={40} className="mx-auto mb-4" style={{ color: 'rgba(84,65,47,0.60)' }} />
                <h3 className="font-display text-2xl tracking-wider mb-2" style={{ color: '#54412F' }}>
                  GOT IT — TALK SOON
                </h3>
                <p className="text-base font-normal leading-relaxed" style={{ color: 'rgba(84,65,47,0.70)' }}>
                  I'll give you a call or text within 24 hours.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit}
                noValidate
                className="space-y-4"
              >
                {/* Name */}
                <div>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputStyle("name")}
                    style={{ ...inputInlineStyle("name"), ['--tw-placeholder-color' as string]: 'rgba(84,65,47,0.35)' } as React.CSSProperties}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-400/80 font-light pl-1">{errors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputStyle("phone")}
                    style={inputInlineStyle("phone")}
                    autoComplete="tel"
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-400/80 font-light pl-1">{errors.phone}</p>
                  )}
                </div>

                {/* Goal */}
                <div>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as GoalValue | "")}
                    className={`${inputStyle("goal")} appearance-none cursor-pointer`}
                    style={{
                      ...inputInlineStyle("goal"),
                      backgroundColor: "#EAE6D2",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2354412F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      paddingRight: "2.5rem",
                      color: goal ? "#54412F" : "rgba(84,65,47,0.35)",
                    }}
                  >
                    <option value="" disabled style={{ color: "rgba(84,65,47,0.35)", backgroundColor: "#EAE6D2" }}>
                      What's your primary goal?
                    </option>
                    {GOAL_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        style={{ color: "#54412F", backgroundColor: "#EAE6D2" }}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.goal && (
                    <p className="mt-1.5 text-xs text-red-400/80 font-light pl-1">{errors.goal}</p>
                  )}
                </div>

                {/* Message (optional) */}
                <div>
                  <textarea
                    placeholder="Anything else you'd like me to know? (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className={`${inputBase} resize-none`}
                    style={{ borderColor: 'rgba(84,65,47,0.25)', color: '#54412F' }}
                  />
                </div>

                {/* Form-level error */}
                {errors.form && (
                  <p className="text-xs text-red-400/80 font-light text-center">{errors.form}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitLead.isPending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-sm tracking-wider uppercase transition-all duration-300 disabled:opacity-60 btn-shimmer hover:scale-[1.02] hover:shadow-lg"
                  style={{ backgroundColor: "#54412F", color: "#EAE6D2" }}
                >
                  {submitLead.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Let's Chat
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {/* Privacy note */}
                <p className="text-center text-sm font-normal pt-1" style={{ color: 'rgba(84,65,47,0.45)' }}>
                  I'll call or text you within 24 hours.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div> {/* end floating cream panel */}
      </div>
    </section>
  );
}
