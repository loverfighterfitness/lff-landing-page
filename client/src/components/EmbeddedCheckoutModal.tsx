/**
 * EmbeddedCheckoutModal
 * Renders Stripe's Embedded Checkout directly on the page — no external redirect.
 * Works in Instagram's in-app browser, Safari, Chrome, everything.
 */
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  clientSecret: string;
  publishableKey: string;
  onClose: () => void;
}

export default function EmbeddedCheckoutModal({ clientSecret, publishableKey, onClose }: Props) {
  const stripePromise = useRef(loadStripe(publishableKey));
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ maxWidth: "520px", maxHeight: "90dvh", backgroundColor: "#fff" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full"
          style={{ width: "36px", height: "36px", backgroundColor: "rgba(0,0,0,0.08)" }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Stripe Embedded Checkout */}
        <div style={{ overflowY: "auto", maxHeight: "90dvh" }}>
          <EmbeddedCheckoutProvider
            stripe={stripePromise.current}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
