import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CalculatorInputs {
  name: string;
  email: string;
  phone: string;
  age: number;
  weight: number;
  height: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "veryActive";
  goal: "bulk" | "cut" | "maintain";
}

interface CalorieResults {
  tdee: number;
  protein: number;
  carbs: number;
  fats: number;
}

export default function CalorieCalculatorSimple() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    name: "",
    email: "",
    phone: "",
    age: 25,
    weight: 80,
    height: 180,
    gender: "male",
    activityLevel: "moderate",
    goal: "bulk",
  });

  const [results, setResults] = useState<CalorieResults | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitCalculator = trpc.calculator.submit.useMutation();

  const calculateCalories = (data: CalculatorInputs): CalorieResults => {
    let bmr: number;
    if (data.gender === "male") {
      bmr = 88.362 + 13.397 * data.weight + 4.799 * data.height - 5.677 * data.age;
    } else {
      bmr = 447.593 + 9.247 * data.weight + 3.098 * data.height - 4.33 * data.age;
    }

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const tdee = bmr * activityMultipliers[data.activityLevel];
    const adjustedTDEE = data.goal === "bulk" ? tdee + 300 : data.goal === "cut" ? tdee - 300 : tdee;

    return {
      tdee: Math.round(adjustedTDEE),
      protein: Math.round((data.weight * 2.2) / 2.2 * 1.6),
      carbs: Math.round((adjustedTDEE * 0.4) / 4),
      fats: Math.round((adjustedTDEE * 0.3) / 9),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const calculated = calculateCalories(inputs);
      setResults(calculated);

      // Try to submit to backend for SMS
      try {
        let backendGoal: "comp_prep" | "bulk" | "cut" | "maintenance" = "maintenance";
        if (inputs.goal === "bulk") backendGoal = "bulk";
        else if (inputs.goal === "cut") backendGoal = "cut";
        else backendGoal = "maintenance";

        // Pick up referral code if the user arrived via a referral link
        const referralCode = sessionStorage.getItem("lff_referral_code") ?? undefined;

        await submitCalculator.mutateAsync({
          name: inputs.name,
          email: inputs.email,
          phone: inputs.phone,
          age: inputs.age,
          weight: inputs.weight,
          height: inputs.height,
          tdee: calculated.tdee,
          bmr: calculated.tdee, // Simple version doesn't expose BMR separately
          protein: calculated.protein,
          carbs: calculated.carbs,
          fats: calculated.fats,
          referredBy: referralCode,
        });

        // Clear the referral code after use so it doesn't persist across multiple submissions
        if (referralCode) sessionStorage.removeItem("lff_referral_code");
      } catch (error) {
        console.error("SMS submission failed, but showing results anyway:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (results) {
    return (
      <div className="relative w-full flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-2xl">
          <div
            className="rounded-3xl px-8 py-14 md:px-14 md:py-16"
            style={{
              backgroundColor: "#EAE6D2",
              boxShadow: "0 40px 100px rgba(0,0,0,0.35), 0 20px 60px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="font-black text-4xl mb-4" style={{ color: "#54412F" }}>
                Your Results
              </h2>
              <p className="text-lg" style={{ color: "rgba(84,65,47,0.65)" }}>
                Here's your personalized nutrition plan, {inputs.name}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div
                className="p-6 rounded-2xl text-center"
                style={{
                  backgroundColor: "rgba(84,65,47,0.08)",
                }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "rgba(84,65,47,0.65)" }}>
                  Daily Calories
                </p>
                <p className="font-black text-3xl" style={{ color: "#54412F" }}>
                  {results.tdee}
                </p>
              </div>
              <div
                className="p-6 rounded-2xl text-center"
                style={{
                  backgroundColor: "rgba(84,65,47,0.08)",
                }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "rgba(84,65,47,0.65)" }}>
                  Protein (g)
                </p>
                <p className="font-black text-3xl" style={{ color: "#54412F" }}>
                  {results.protein}
                </p>
              </div>
              <div
                className="p-6 rounded-2xl text-center"
                style={{
                  backgroundColor: "rgba(84,65,47,0.08)",
                }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "rgba(84,65,47,0.65)" }}>
                  Carbs (g)
                </p>
                <p className="font-black text-3xl" style={{ color: "#54412F" }}>
                  {results.carbs}
                </p>
              </div>
              <div
                className="p-6 rounded-2xl text-center"
                style={{
                  backgroundColor: "rgba(84,65,47,0.08)",
                }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "rgba(84,65,47,0.65)" }}>
                  Fats (g)
                </p>
                <p className="font-black text-3xl" style={{ color: "#54412F" }}>
                  {results.fats}
                </p>
              </div>
            </div>

            <motion.button
              onClick={() => setResults(null)}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 font-black text-lg tracking-widest uppercase rounded-full flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#54412F",
                color: "#EAE6D2",
                boxShadow: "0 8px 24px rgba(84,65,47,0.20)",
              }}
            >
              ← Back to Calculator
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-2xl">
        <div
          className="rounded-3xl px-8 py-14 md:px-14 md:py-16"
          style={{
            backgroundColor: "#EAE6D2",
            boxShadow: "0 40px 100px rgba(0,0,0,0.35), 0 20px 60px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <p className="text-xs tracking-[0.3em] uppercase mb-4 font-black" style={{ color: "rgba(84,65,47,0.50)" }}>
              Lover Fighter Fitness
            </p>
            <h1 className="font-black text-4xl md:text-5xl mb-4" style={{ color: "#54412F" }}>
              Calorie Calculator
            </h1>
            <p className="text-lg" style={{ color: "rgba(84,65,47,0.65)" }}>
              Get your personalized nutrition plan
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                Name
              </label>
              <input
                type="text"
                value={inputs.name}
                onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:border-lff-brown"
                style={{ color: "#54412F" }}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                Email
              </label>
              <input
                type="email"
                value={inputs.email}
                onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:border-lff-brown"
                style={{ color: "#54412F" }}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={inputs.phone}
                onChange={(e) => setInputs({ ...inputs, phone: e.target.value })}
                placeholder="+61 4XX XXX XXX"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:border-lff-brown"
                style={{ color: "#54412F" }}
              />
            </div>

            {/* Age */}
            <div>
              <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                Age: {inputs.age}
              </label>
              <input
                type="range"
                min="18"
                max="70"
                value={inputs.age}
                onChange={(e) => setInputs({ ...inputs, age: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                Weight (kg): {inputs.weight}
              </label>
              <input
                type="range"
                min="40"
                max="150"
                value={inputs.weight}
                onChange={(e) => setInputs({ ...inputs, weight: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                Height (cm): {inputs.height}
              </label>
              <input
                type="range"
                min="140"
                max="220"
                value={inputs.height}
                onChange={(e) => setInputs({ ...inputs, height: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                Gender
              </label>
              <select
                value={inputs.gender}
                onChange={(e) => setInputs({ ...inputs, gender: e.target.value as "male" | "female" })}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:border-lff-brown"
                style={{ color: "#54412F" }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                Activity Level
              </label>
              <select
                value={inputs.activityLevel}
                onChange={(e) => setInputs({ ...inputs, activityLevel: e.target.value as any })}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:border-lff-brown"
                style={{ color: "#54412F" }}
              >
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="veryActive">Very Active</option>
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className="block font-black mb-2" style={{ color: "#54412F" }}>
                Goal
              </label>
              <select
                value={inputs.goal}
                onChange={(e) => setInputs({ ...inputs, goal: e.target.value as "bulk" | "cut" | "maintain" })}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:border-lff-brown"
                style={{ color: "#54412F" }}
              >
                <option value="bulk">Bulk</option>
                <option value="cut">Cut</option>
                <option value="maintain">Maintain</option>
              </select>
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
              {isSubmitting ? "Calculating..." : "Get My Results"}
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
        </div>
      </div>
    </div>
  );
}
