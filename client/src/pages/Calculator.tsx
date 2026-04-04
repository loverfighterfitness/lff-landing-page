import CalorieCalculator from "@/components/CalorieCalculator";

const LOGO_TRANSPARENT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

export default function Calculator() {
  return (
    <div className="min-h-screen bg-lff-dark flex flex-col">
      {/* Logo centered above calculator */}
      <div className="flex items-center justify-center" style={{ paddingTop: "clamp(2rem, 5vh, 4rem)", paddingBottom: "clamp(1rem, 2.5vh, 2rem)" }}>
        <a href="/" className="flex items-center justify-center">
          <img
            src={LOGO_TRANSPARENT}
            alt="Lover Fighter Fitness"
            className="w-auto object-contain bg-transparent"
            style={{ height: "240px" }}
          />
        </a>
      </div>
      {/* Calculator centered */}
      <div className="w-full flex-1 flex items-start justify-center px-4" style={{ paddingBottom: "clamp(2rem, 5vh, 4rem)" }}>
        <div className="w-full max-w-4xl">
          <CalorieCalculator />
        </div>
      </div>
    </div>
  );
}
