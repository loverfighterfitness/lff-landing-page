/**
 * Calorie Calculator — Lead Generator (Redesigned)
 * Matches coaching packages section styling: cream panels, hover animations, bolder text
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CalculatorInputs {
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "veryActive";
  goal: "extremeCut" | "moderateCut" | "maintain" | "leanBulk";
}

interface CalculatorResults {
  bmr: number;
  tdee: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface EmailCapture {
  name: string;
  email: string;
  phone: string;
}

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.35,
  moderate: 1.45,
  active: 1.55,
  veryActive: 1.65,
};

// Goal adjustments as flat calorie deficits/surpluses applied after TDEE calculation
const goalAdjustments = {
  extremeCut: -750,
  moderateCut: -400,
  maintain: 0,
  leanBulk: 250,
};

const goalLabels = {
  extremeCut: "Extreme Cut",
  moderateCut: "Moderate Cut",
  maintain: "Maintain",
  leanBulk: "Lean Bulk",
};

function calculateCalories(inputs: CalculatorInputs): CalculatorResults {
  // Mifflin-St Jeor formula for BMR
  let bmr: number;
  if (inputs.gender === "male") {
    bmr = 10 * inputs.weight + 6.25 * inputs.height - 5 * inputs.age + 5;
  } else {
    bmr = 10 * inputs.weight + 6.25 * inputs.height - 5 * inputs.age - 161;
  }

  // TDEE with activity level
  let tdee = bmr * activityMultipliers[inputs.activityLevel];

  // Apply flat calorie adjustment for goal
  tdee = tdee + goalAdjustments[inputs.goal];

  // Protein: weight (kg) × 2.2 = grams
  const protein = Math.round(inputs.weight * 2.2);

  // Remaining calories after protein (4 cal/g)
  const proteinCalories = protein * 4;
  const remainingCalories = tdee - proteinCalories;

  // Carbs: 45% of remaining calories (4 cal/g)
  const carbs = Math.round((remainingCalories * 0.45) / 4);

  // Fats: 55% of remaining calories (9 cal/g)
  const fats = Math.round((remainingCalories * 0.55) / 9);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    protein,
    carbs,
    fats,
  };
}

function InputPanel({ children }: { children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 28 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 28 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(hover: none)").matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={panelRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isTouchDevice ? 0 : rotateX,
        rotateY: isTouchDevice ? 0 : rotateY,
        transformStyle: "preserve-3d",
        boxShadow: "0 4px 24px rgba(84,65,47,0.10)",
      }}
      whileHover={
        !isTouchDevice
          ? {
              scale: 1.02,
              y: -8,
              boxShadow: "0 40px 100px rgba(84,65,47,0.20), 0 12px 40px rgba(84,65,47,0.14)",
              transition: { type: "spring", stiffness: 320, damping: 20 },
            }
          : undefined
      }
      className="bg-lff-cream rounded-2xl p-8 md:p-10 cursor-pointer group"
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(105deg, transparent 35%, rgba(84,65,47,0.05) 50%, transparent 65%)",
            animation: "shimmer-sweep 1.4s ease-in-out infinite",
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function ResultCard({
  label,
  value,
  unit,
  index,
}: {
  label: string;
  value: number;
  unit?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-lff-cream rounded-2xl p-6 md:p-8 text-center group hover:shadow-lg transition-shadow"
      style={{
        boxShadow: "0 4px 24px rgba(84,65,47,0.10)",
      }}
    >
      <p className="text-sm font-black tracking-wide uppercase mb-3" style={{ color: "rgba(84,65,47,0.50)" }}>
        {label}
      </p>
      <p
        className="font-display font-black group-hover:scale-105 transition-transform origin-center"
        style={{
          color: "#54412F",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          lineHeight: 1,
        }}
      >
        {value.toLocaleString()}
      </p>
      {unit && <p className="text-xs font-semibold mt-2" style={{ color: "rgba(84,65,47,0.40)" }}>{unit}</p>}
    </motion.div>
  );
}

export default function CalorieCalculator() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"inputs" | "email" | "results">("inputs");
  const [inputs, setInputs] = useState<CalculatorInputs>({
    age: 25,
    weight: 70,
    height: 180,
    gender: "male",
    activityLevel: "moderate",
    goal: "maintain",
  });
  const [emailData, setEmailData] = useState<EmailCapture>({
    name: "",
    email: "",
    phone: "",
  });
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const submitCalculator = trpc.calculator.submit.useMutation();

  const handleSliderChange = (field: keyof CalculatorInputs, value: number) => {
    setInputs({ ...inputs, [field]: value });
  };

  const handleSelectChange = (field: keyof CalculatorInputs, value: string) => {
    setInputs({ ...inputs, [field]: value as any });
  };

  const handleCalculate = () => {
    const calculated = calculateCalories(inputs);
    setResults(calculated);
    setStep("email");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!results) return;

    // Always show results — SMS is best-effort
    try {
      let backendGoal: "comp_prep" | "bulk" | "cut" | "maintenance" = "maintenance";
      if (inputs.goal === "leanBulk") backendGoal = "bulk";
      else if (inputs.goal === "extremeCut" || inputs.goal === "moderateCut") backendGoal = "cut";
      else if (inputs.goal === "maintain") backendGoal = "maintenance";

      await submitCalculator.mutateAsync({
        name: emailData.name,
        email: emailData.email,
        phone: emailData.phone,
        age: inputs.age,
        weight: inputs.weight,
        height: inputs.height,
        goal: inputs.goal,
        tdee: results.tdee,
        bmr: results.bmr,
        protein: results.protein,
        carbs: results.carbs,
        fats: results.fats,
      });
    } catch (error) {
      // SMS/DB save failed — log silently, still show results
      console.error("[Calculator] Backend submission failed (SMS may not send):", error);
    }

    // Always advance to results regardless
    setStep("results");
  };

  const isSubmitting = submitCalculator.isPending;

  return (
    <div className="relative w-full flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-4xl">
        {/* Cream panel - no outer brown background */}
        <div
          className="rounded-3xl px-8 py-14 md:px-14 md:py-16"
          style={{
            backgroundColor: "#EAE6D2",
            boxShadow: "0 40px 100px rgba(0,0,0,0.35), 0 20px 60px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 md:mb-16 text-center"
          >
            <p className="text-xs tracking-[0.3em] uppercase mb-4 font-black" style={{ color: "rgba(84,65,47,0.50)" }}>
              Lover Fighter Fitness
            </p>
            <h1
              className="font-display leading-tight mb-4"
              style={{
                color: "#54412F",
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                fontWeight: 900,
              }}
            >
              CALORIE CALCULATOR
            </h1>
            <p className="max-w-lg mx-auto text-base font-semibold" style={{ color: "rgba(84,65,47,0.65)" }}>
              Understand your daily calorie needs and take the first step towards your goals.
            </p>
          </motion.div>

          {/* Step 1: Inputs */}
          {step === "inputs" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <InputPanel>
                <div className="space-y-8">
                  {/* Age Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-black text-lg" style={{ color: "#54412F" }}>
                        Age
                      </label>
                      <span className="font-display font-black text-3xl" style={{ color: "#54412F" }}>
                        {inputs.age}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="70"
                      value={inputs.age}
                      onChange={(e) => handleSliderChange("age", parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-lff-brown"
                    />
                    <div className="flex justify-between text-xs font-semibold mt-2" style={{ color: "rgba(84,65,47,0.40)" }}>
                      <span>18</span>
                      <span>Your age in years</span>
                      <span>70</span>
                    </div>
                  </div>

                  {/* Weight Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-black text-lg" style={{ color: "#54412F" }}>
                        Weight
                      </label>
                      <span className="font-display font-black text-3xl" style={{ color: "#54412F" }}>
                        {inputs.weight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="150"
                      value={inputs.weight}
                      onChange={(e) => handleSliderChange("weight", parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-lff-brown"
                    />
                    <div className="flex justify-between text-xs font-semibold mt-2" style={{ color: "rgba(84,65,47,0.40)" }}>
                      <span>40</span>
                      <span>Your weight in kilograms</span>
                      <span>150</span>
                    </div>
                  </div>

                  {/* Height Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-black text-lg" style={{ color: "#54412F" }}>
                        Height
                      </label>
                      <span className="font-display font-black text-3xl" style={{ color: "#54412F" }}>
                        {inputs.height}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="140"
                      max="210"
                      value={inputs.height}
                      onChange={(e) => handleSliderChange("height", parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-lff-brown"
                    />
                    <div className="flex justify-between text-xs font-semibold mt-2" style={{ color: "rgba(84,65,47,0.40)" }}>
                      <span>140</span>
                      <span>Your height in centimeters</span>
                      <span>210</span>
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="font-black text-lg block mb-4" style={{ color: "#54412F" }}>
                      Gender
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={inputs.gender === "male"}
                          onChange={(e) => handleSelectChange("gender", e.target.value)}
                          className="w-5 h-5"
                        />
                        <span className="font-bold" style={{ color: "#54412F" }}>
                          Male
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={inputs.gender === "female"}
                          onChange={(e) => handleSelectChange("gender", e.target.value)}
                          className="w-5 h-5"
                        />
                        <span className="font-bold" style={{ color: "#54412F" }}>
                          Female
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div>
                    <label className="font-black text-lg block mb-4" style={{ color: "#54412F" }}>
                      Activity Level
                    </label>
                    <select
                      value={inputs.activityLevel}
                      onChange={(e) => handleSelectChange("activityLevel", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-bold focus:outline-none focus:border-lff-brown"
                      style={{ color: "#54412F" }}
                    >
                      <option value="sedentary">Under 5,000 steps/day</option>
                       <option value="light">5,000–7,500 steps/day</option>
                       <option value="moderate">7,500–10,000 steps/day</option>
                       <option value="active">10,000–15,000 steps/day</option>
                       <option value="veryActive">15,000+ steps/day</option>
                    </select>
                  </div>

                  {/* Goal */}
                  <div>
                    <label className="font-black text-lg block mb-4" style={{ color: "#54412F" }}>
                      Your Goal
                    </label>
                    <div className="space-y-3">
                      {(["extremeCut", "moderateCut", "maintain", "leanBulk"] as const).map((goal) => (
                        <label key={goal} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="goal"
                            value={goal}
                            checked={inputs.goal === goal}
                            onChange={(e) => handleSelectChange("goal", e.target.value)}
                            className="w-5 h-5"
                          />
                          <span className="font-bold" style={{ color: "#54412F" }}>
                            {goalLabels[goal]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </InputPanel>

              <motion.button
                onClick={handleCalculate}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 font-black text-lg tracking-widest uppercase rounded-full flex items-center justify-center gap-2 group/btn transition-all"
                style={{
                  backgroundColor: "#54412F",
                  color: "#EAE6D2",
                  boxShadow: "0 8px 24px rgba(84,65,47,0.20)",
                }}
              >
                Calculate My Calories
                <motion.div
                  animate={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ArrowRight size={18} />
                </motion.div>
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Email Capture */}
          {step === "email" && results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InputPanel>
                <div className="space-y-6">
                  <div>
                    <h2
                      className="font-display font-black mb-2"
                      style={{
                        color: "#54412F",
                        fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                      }}
                    >
                      Get Your Personalized Plan
                    </h2>
                    <p className="text-base font-semibold" style={{ color: "rgba(84,65,47,0.65)" }}>
                      Enter your details to see your results and get a personalized coaching recommendation.
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={emailData.name}
                        onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:border-lff-brown"
                        style={{ color: "#54412F" }}
                      />
                    </div>
                    <div>
                      <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={emailData.email}
                        onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:border-lff-brown"
                        style={{ color: "#54412F" }}
                      />
                    </div>
                    <div>
                      <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={emailData.phone}
                        onChange={(e) => setEmailData({ ...emailData, phone: e.target.value })}
                        placeholder="+61 4XX XXX XXX"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:border-lff-brown"
                        style={{ color: "#54412F" }}
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-4 font-black text-lg tracking-widest uppercase rounded-full flex items-center justify-center gap-2 group/btn transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "#54412F",
                        color: "#EAE6D2",
                        boxShadow: "0 8px 24px rgba(84,65,47,0.20)",
                      }}
                    >
                      {isSubmitting ? "Sending..." : "See My Results"}
                      {!isSubmitting && (
                        <motion.div
                          animate={{ x: 0 }}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <ArrowRight size={18} />
                        </motion.div>
                      )}
                    </motion.button>
                  </form>

                  <button
                    onClick={() => setStep("inputs")}
                    className="w-full py-2 font-semibold transition-colors"
                    style={{ color: "rgba(84,65,47,0.50)" }}
                  >
                    ← Back to Calculator
                  </button>
                </div>
              </InputPanel>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {step === "results" && results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* TDEE Hero */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-8 md:p-12 text-center group"
                style={{
                  backgroundColor: "#54412F",
                  boxShadow: "0 4px 24px rgba(84,65,47,0.20)",
                }}
              >
                <p className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: "rgba(234,230,210,0.50)" }}>
                  Calories estimated for your goals
                </p>
                <p
                  className="font-display font-black group-hover:scale-105 transition-transform origin-center"
                  style={{
                    color: "#EAE6D2",
                    fontSize: "clamp(3rem, 8vw, 5rem)",
                    lineHeight: 1,
                  }}
                >
                  {results.tdee.toLocaleString()}
                </p>
                <p className="text-base font-bold mt-3" style={{ color: "rgba(234,230,210,0.60)" }}>
                  Calories per day
                </p>
              </motion.div>

              {/* BMR */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-8 md:p-10 flex justify-between items-center group"
                style={{
                  backgroundColor: "#EAE6D2",
                  boxShadow: "0 4px 24px rgba(84,65,47,0.10)",
                }}
              >
                <div>
                  <p className="text-xs font-black tracking-wide uppercase mb-1" style={{ color: "rgba(84,65,47,0.50)" }}>
                    Basal Metabolic Rate (BMR)
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "rgba(84,65,47,0.40)" }}>
                    Calories per day
                  </p>
                </div>
                <p
                  className="font-display font-black group-hover:scale-105 transition-transform origin-right"
                  style={{
                    color: "#54412F",
                    fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  }}
                >
                  {results.bmr.toLocaleString()}
                </p>
              </motion.div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-4">
                <ResultCard label="Carbs" value={results.carbs} unit="grams" index={0} />
                <ResultCard label="Protein" value={results.protein} unit="grams" index={1} />
                <ResultCard label="Fats" value={results.fats} unit="grams" index={2} />
              </div>

              {/* Disclaimer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-sm font-semibold px-2"
                style={{ color: "rgba(84,65,47,0.45)" }}
              >
                These are estimates based on population averages. A personalised coaching plan will provide exact targets tailored to your body, training, and goals.
              </motion.p>

              {/* CTA Section */}
              <InputPanel>
                <div className="text-center space-y-6">
                  <div>
                    <h3
                      className="font-display font-black mb-3"
                      style={{
                        color: "#54412F",
                        fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                      }}
                    >
                      Want a personalised plan to guarantee results?
                    </h3>
                    <p className="text-base font-semibold" style={{ color: "rgba(84,65,47,0.65)" }}>
                      Understand your daily calorie needs and take the first step towards a healthier lifestyle. See how online coaching can help you achieve your goals.
                    </p>
                  </div>

                  <motion.button
                    onClick={() => setLocation("/")}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 font-black text-lg tracking-widest uppercase rounded-full flex items-center justify-center gap-2 group/btn transition-all"
                    style={{
                      backgroundColor: "#54412F",
                      color: "#EAE6D2",
                      boxShadow: "0 8px 24px rgba(84,65,47,0.20)",
                    }}
                  >
                    Get Started
                    <motion.div
                      animate={{ x: 0 }}
                      whileHover={{ x: 4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <ArrowRight size={18} />
                    </motion.div>
                  </motion.button>
                </div>
              </InputPanel>

              <button
                onClick={() => {
                  setStep("inputs");
                  setResults(null);
                }}
                className="w-full py-2 font-semibold transition-colors"
                style={{ color: "rgba(84,65,47,0.50)" }}
              >
                ← Calculate Again
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
