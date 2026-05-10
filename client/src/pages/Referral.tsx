/**
 * Referral landing page — /ref/[code]
 * Validates the referral code, stores it in sessionStorage, then redirects to the homepage.
 * The calculator will pick up the code from sessionStorage and attach it to the lead submission.
 */
import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

const LOGO_CREAM =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_59ca0122.png";

export default function Referral() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading } = trpc.referral.validate.useQuery(
    { code: code ?? "" },
    { enabled: !!code }
  );

  useEffect(() => {
    if (!data) return;
    if (data.valid && code) {
      // Store the referral code so the calculator can attach it to the submission
      sessionStorage.setItem("lff_referral_code", code.toUpperCase());
    }
    // Redirect to homepage after a short delay so the user sees the welcome message
    const timer = setTimeout(() => setLocation("/"), 2200);
    return () => clearTimeout(timer);
  }, [data, code, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#54412F" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "#EAE6D2" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center" style={{ backgroundColor: "#54412F" }}>
      <img src={LOGO_CREAM} alt="Lover Fighter Fitness" className="h-20 opacity-90" />

      {data?.valid ? (
        <>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(234,230,210,0.5)" }}>
              Referred by
            </p>
            <h1 className="text-4xl font-black" style={{ color: "#EAE6D2", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
              {data.referrerName}
            </h1>
          </div>
          <div className="rounded-2xl px-8 py-6 max-w-sm" style={{ backgroundColor: "rgba(234,230,210,0.1)", border: "1px solid rgba(234,230,210,0.2)" }}>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "rgba(234,230,210,0.5)" }}>Your exclusive offer</p>
            <p className="text-3xl font-black mb-1" style={{ color: "#EAE6D2", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
              2 WEEKS FREE
            </p>
            <p className="text-sm" style={{ color: "rgba(234,230,210,0.7)" }}>
              Your first 2 weeks of coaching are on us — automatically applied at checkout.
            </p>
          </div>
          <p className="text-xs" style={{ color: "rgba(234,230,210,0.35)" }}>Redirecting you to the site...</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: "#EAE6D2",
                  opacity: 0.3,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-black mb-3" style={{ color: "#EAE6D2", fontFamily: "'Bebas Neue', sans-serif" }}>
              Invalid Referral Code
            </h1>
            <p className="text-sm" style={{ color: "rgba(234,230,210,0.6)" }}>
              This referral link doesn't look right. Redirecting you to the site...
            </p>
          </div>
        </>
      )}
    </div>
  );
}
