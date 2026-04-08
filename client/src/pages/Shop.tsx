/**
 * Shop — LFF Merch Storefront
 * Design: Full-viewport product gallery · Spinners float on concrete
 * Each product gets its own section with alternating left/right split
 * Frosted glass only on small info cards, never wrapping spinners
 */
import React, { useRef, useEffect, useState, memo, useContext } from "react";
import {
  motion,
  AnimatePresence,
  useTransform,
  useScroll,
  useInView,
  useSpring,
} from "framer-motion";
import { ArrowRight, Instagram, RotateCcw, MapPin, Truck, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─── CDN Assets ─── */
const LOGO_TRANSPARENT =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

/* Brand photography */
const BRAND_SUBWAY = "/shop/subway.jpg";
const BRAND_UNDERBRIDGE = "/shop/under-bridge.jpg";
const BRAND_LOGO_BW = "/shop/logo-bw.jpg";

/* Tee spin videos */
type TeeColour = "brown" | "black" | "cream";
const TEE_SPIN_VIDEOS: Record<TeeColour, string> = {
  brown: "/shop/tee-brown-spin.mp4",
  black: "/shop/tee-black-spin.mp4",
  cream: "/shop/tee-cream-spin.mp4",
};

/* ─── Design Tokens ─── */
const PILL_RADIUS = "9999px";
const PANEL_RADIUS = "2rem";

const frostedCard: React.CSSProperties = {
  background: "rgba(84,65,47,0.55)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(234,230,210,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.2)",
  borderRadius: PANEL_RADIUS,
};

/* Cream card — brown text on cream glass, for light sections */
const creamCard: React.CSSProperties = {
  background: "rgba(234,230,210,0.85)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(84,65,47,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 24px 60px rgba(0,0,0,0.08)",
  borderRadius: PANEL_RADIUS,
};

const concreteTexture: React.CSSProperties = {
  backgroundColor: "#3a2c1e",
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
  backgroundSize: "300px 300px",
  backgroundBlendMode: "overlay",
};

/* ─── Types ─── */
interface Product {
  id: string;
  name: string;
  tagline: string;
  price: number;
  stock: number | null;
  stripeLink?: string;
  shippingStripeLink?: string; // +$10 shipping variant
  image?: string;
  hoverImage?: string;
  hoverVideo?: string;
  placeholderStyle?: React.CSSProperties;
}

/* ─── Product Catalog ─── */
const SOCKS: Product[] = [
  {
    id: "socks-cream",
    name: "LFF Crew Socks",
    tagline: "Cream",
    price: 10,
    stock: 30,
    stripeLink: "https://buy.stripe.com/cNi8wPaYO4rtdZO1cQbwk06",
    shippingStripeLink: "https://buy.stripe.com/eVqdR9d6Wgab5ti7Bebwk0b",
    image: "/shop/socks-cream-hero.jpg",
  },
  {
    id: "socks-brown",
    name: "LFF Crew Socks",
    tagline: "Brown",
    price: 10,
    stock: 30,
    stripeLink: "https://buy.stripe.com/dRm8wP7MC0bd08Y1cQbwk07",
    shippingStripeLink: "https://buy.stripe.com/00w8wP3wm5vx3la1cQbwk0c",
    image: "/shop/socks-brown-hero.jpg",
    hoverImage: "/shop/socks-brown-action.jpg",
  },
];

const STRAPS: Product[] = [
  {
    id: "lifting-straps",
    name: "Lifting Straps",
    tagline: "Built to pull heavy",
    price: 35,
    stock: 15,
    stripeLink: "https://buy.stripe.com/dRm8wP8QG9LN1d23kYbwk08",
    shippingStripeLink: "https://buy.stripe.com/fZu00jgj86zBf3S4p2bwk0d",
    image: "/shop/straps-flatlay.jpg",
    hoverVideo: "/shop/straps-video.mp4",
  },
];

const CUFFS: Product[] = [
  {
    id: "cuffs",
    name: "Wrist Cuffs",
    tagline: "Lock in. Lift more.",
    price: 25,
    stock: 15,
    stripeLink: "https://buy.stripe.com/7sY4gz4Aq7DF8Fu1cQbwk09",
    shippingStripeLink: "https://buy.stripe.com/fZu00j6Iy2jl8Fuf3Gbwk0e",
    image: "/shop/cuffs-flatlay.jpg",
    hoverVideo: "/shop/cuffs-video.mp4",
  },
];

/* ─── Scroll Reveal ─── */
function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Breathing Dot ─── */
const BreathingDot = memo(function BreathingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full"
        style={{ backgroundColor: color, opacity: 0.6 }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span
        className="relative inline-flex rounded-full h-1.5 w-1.5"
        style={{ backgroundColor: color }}
      />
    </span>
  );
});

/* ─── Shipping Modal ─── */
interface ShippingModalState {
  open: boolean;
  productName: string;
  price: number;
  pickupLink: string;
  shippingLink: string;
}

const SHIPPING_COST = 10;

function ShippingModal({
  state,
  onClose,
}: {
  state: ShippingModalState;
  onClose: () => void;
}) {
  // Lock body scroll when open
  useEffect(() => {
    if (state.open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [state.open]);

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md"
            style={{
              background: "rgba(58,44,30,0.97)",
              border: "1px solid rgba(234,230,210,0.1)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
              borderRadius: PANEL_RADIUS,
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-lff-cream/40 hover:text-lff-cream transition-colors"
            >
              <X size={18} />
            </button>

            <div className="p-8 space-y-6">
              {/* Header */}
              <div>
                <p className="text-lff-cream/40 text-[10px] tracking-[0.35em] uppercase font-medium mb-2">
                  How are you getting it?
                </p>
                <h3
                  className="text-lff-cream text-2xl tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {state.productName}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {/* Local Pickup */}
                <motion.a
                  href={state.pickupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 w-full p-5 rounded-2xl border border-lff-cream/10 hover:border-lff-cream/25 bg-lff-cream/5 hover:bg-lff-cream/10 transition-all duration-300 text-left"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-lff-cream/10 flex items-center justify-center">
                    <MapPin size={18} className="text-lff-cream" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lff-cream text-sm font-semibold tracking-wide">
                      Local Pickup
                    </p>
                    <p className="text-lff-cream/40 text-xs mt-0.5">
                      Mount Barker, SA
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-lff-cream text-lg tabular-nums"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      ${state.price}
                    </span>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-green-400/70 font-medium">
                      Free
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-lff-cream/30 flex-shrink-0" />
                </motion.a>

                {/* Australia-Wide Shipping */}
                <motion.a
                  href={state.shippingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 w-full p-5 rounded-2xl border border-lff-cream/10 hover:border-lff-cream/25 bg-lff-cream/5 hover:bg-lff-cream/10 transition-all duration-300 text-left"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-lff-cream/10 flex items-center justify-center">
                    <Truck size={18} className="text-lff-cream" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lff-cream text-sm font-semibold tracking-wide">
                      Aus-Wide Shipping
                    </p>
                    <p className="text-lff-cream/40 text-xs mt-0.5">
                      Delivered to your door
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-lff-cream/40 text-sm tabular-nums line-through"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      ${state.price}
                    </span>
                    <span
                      className="text-lff-cream text-lg tabular-nums ml-1.5"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      ${state.price + SHIPPING_COST}
                    </span>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-lff-cream/40 font-medium">
                      Includes ${SHIPPING_COST} shipping
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-lff-cream/30 flex-shrink-0" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Sock Card (hover video support) ─── */
const SockCard = memo(function SockCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = hovered && !!product.hoverVideo;
  const isLow = product.stock !== null && product.stock <= 15;

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else if (!showVideo && videoRef.current) {
      videoRef.current.pause();
    }
  }, [showVideo]);

  const openModal = useContext(ShippingContext);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() =>
          openModal(
            `${product.name} — ${product.tagline}`,
            product.price,
            product.stripeLink || "#",
            product.shippingStripeLink || product.stripeLink || "#",
          )
        }
        className="block relative overflow-hidden aspect-[4/5] cursor-pointer w-full text-left"
        style={{ borderRadius: "1.5rem" }}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {product.hoverVideo && (
          <video
            ref={videoRef}
            src={product.hoverVideo}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: showVideo ? 1 : 0 }}
          />
        )}
        {product.hoverImage && (
          <img
            src={product.hoverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: hovered ? 1 : 0 }}
          />
        )}

        {/* Hover: Order Now pill slides up */}
        <div className="absolute bottom-3 left-3 right-3 translate-y-[calc(100%+1rem)] group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <div
            className="bg-lff-cream text-lff-brown py-3 flex items-center justify-center gap-2"
            style={{ borderRadius: PILL_RADIUS }}
          >
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase">
              Order Now
            </span>
            <ArrowRight size={12} strokeWidth={2.5} />
          </div>
        </div>
      </button>

      <div className="mt-3 space-y-0.5 px-1">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lff-brown text-sm font-medium tracking-wide">
            {product.name}
          </h3>
          <span
            className="text-lff-brown text-sm tabular-nums"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ${product.price}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-lff-brown/55 text-xs tracking-wider">{product.tagline}</p>
          <div className="flex items-center gap-1.5">
            <BreathingDot color={isLow ? "#D4A574" : "#7CAE7A"} />
            <span className="text-[9px] tracking-[0.15em] uppercase text-lff-brown/45 font-medium">
              {isLow ? `${product.stock} left` : "In Stock"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

/* ─── Mobile Detection ─── */
const IS_MOBILE = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
const MOBILE_FRAMES = 48;
const DESKTOP_FRAMES = 48;
const MOBILE_SCALE = 768;
const DESKTOP_SCALE = 768;

/* ─── Frame Cache (in-memory + IndexedDB) ─── */
const frameCache = new Map<string, string[]>();
const frameCacheListeners = new Map<string, ((frames: string[]) => void)[]>();

function getCacheKey(src: string, frameCount: number, blackThreshold: number, brightnessBoost: number, chromaKey: string) {
  return `${src}|${frameCount}|${blackThreshold}|${brightnessBoost}|${chromaKey}`;
}

// Cache version — bump this to wipe all cached frames
const CACHE_VERSION = "v5";

// IndexedDB helpers
function openFrameDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("lff-spinner-cache", 5);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains("frames")) {
        db.deleteObjectStore("frames");
      }
      db.createObjectStore("frames");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Wipe stale cache on page load
if (typeof window !== "undefined") {
  try {
    const lastVersion = localStorage.getItem("lff-cache-ver");
    if (lastVersion !== CACHE_VERSION) {
      indexedDB.deleteDatabase("lff-spinner-cache");
      localStorage.setItem("lff-cache-ver", CACHE_VERSION);
    }
  } catch { /* silent */ }
}

async function getFromIDB(key: string): Promise<string[] | null> {
  try {
    const db = await openFrameDB();
    return new Promise((resolve) => {
      const tx = db.transaction("frames", "readonly");
      const req = tx.objectStore("frames").get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function saveToIDB(key: string, frames: string[]) {
  try {
    const db = await openFrameDB();
    const tx = db.transaction("frames", "readwrite");
    tx.objectStore("frames").put(frames, key);
  } catch { /* silent */ }
}

/* ─── Frame Extraction Hook ─── */
function useVideoFrames(
  src: string,
  frameCount = 36,
  removeBlackBg = true,
  blackThreshold = 2,
  brightnessBoost = 1,
  chromaKey: "black" | "blue" = "black",
  /** Set true to defer extraction until element is near viewport */
  lazy = false,
) {
  const [frames, setFrames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(!lazy);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Lazy loading — observe a sentinel element
  useEffect(() => {
    if (!lazy || visible) return;
    const el = sentinelRef.current;
    if (!el) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [lazy, visible]);

  // Override frame count on mobile
  const effectiveFrames = IS_MOBILE ? Math.min(frameCount, MOBILE_FRAMES) : frameCount;

  useEffect(() => {
    if (!visible) return;
    const key = getCacheKey(src, effectiveFrames, blackThreshold, brightnessBoost, chromaKey);

    // 1. Check in-memory cache (instant — same page session)
    const cached = frameCache.get(key);
    if (cached && cached.length === effectiveFrames) {
      setFrames(cached);
      setLoading(false);
      return;
    }

    // 2. If another hook is already extracting this exact video, just listen
    if (frameCacheListeners.has(key)) {
      const listener = (f: string[]) => { setFrames(f); setLoading(false); };
      frameCacheListeners.get(key)!.push(listener);
      return;
    }

    // 3. Check IndexedDB (fast — returning visitors)
    setLoading(true);
    setFrames([]);
    const listeners: ((frames: string[]) => void)[] = [];
    frameCacheListeners.set(key, listeners);
    let aborted = false;

    getFromIDB(key).then((idbFrames) => {
      if (aborted) return;
      if (idbFrames && idbFrames.length === effectiveFrames) {
        frameCache.set(key, idbFrames);
        setFrames(idbFrames);
        setLoading(false);
        listeners.forEach((fn) => fn(idbFrames));
        frameCacheListeners.delete(key);
        return;
      }

      // 4. Extract from video
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      // iOS needs these attributes to load without user gesture
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.src = src;
      video.load(); // Explicitly trigger load on mobile

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const extracted: string[] = [];
      let frameIndex = 0;

      const extractFrame = () => {
        if (aborted) return;
        const maxDim = IS_MOBILE ? MOBILE_SCALE : DESKTOP_SCALE;
        const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
        const w = Math.round(video.videoWidth * scale);
        const h = Math.round(video.videoHeight * scale);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;
        if (removeBlackBg) {
          if (chromaKey === "blue") {
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i], g = d[i + 1], b = d[i + 2];
              if (b > 100 && b > r * 1.5 && b > g * 1.3) {
                d[i + 3] = 0;
              } else if (b > 80 && b > r * 1.2 && b > g * 1.1) {
                const blueness = (b - Math.max(r, g)) / b;
                d[i + 3] = Math.round((1 - blueness) * 255);
                d[i + 2] = Math.min(d[i + 2], Math.max(d[i], d[i + 1]));
              } else if (b > r && b > g) {
                d[i + 2] = Math.min(b, Math.round(Math.max(r, g) * 1.1));
              }
            }
            // Apply brightness boost AFTER blue removal
            if (brightnessBoost > 1) {
              for (let i = 0; i < d.length; i += 4) {
                if (d[i + 3] === 0) continue; // skip transparent pixels
                d[i] = Math.min(255, Math.round(d[i] * brightnessBoost));
                d[i + 1] = Math.min(255, Math.round(d[i + 1] * brightnessBoost));
                d[i + 2] = Math.min(255, Math.round(d[i + 2] * brightnessBoost));
              }
            }
          } else {
            if (brightnessBoost > 1) {
              for (let i = 0; i < d.length; i += 4) {
                d[i] = Math.min(255, Math.round(d[i] * brightnessBoost));
                d[i + 1] = Math.min(255, Math.round(d[i + 1] * brightnessBoost));
                d[i + 2] = Math.min(255, Math.round(d[i + 2] * brightnessBoost));
              }
            }
            for (let i = 0; i < d.length; i += 4) {
              const maxCh = Math.max(d[i], d[i + 1], d[i + 2]);
              if (maxCh <= blackThreshold) {
                d[i + 3] = 0;
              }
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }
        extracted.push(canvas.toDataURL("image/webp", 0.95));
        frameIndex++;
        if (frameIndex === 1) {
          setFrames([...extracted]);
          setLoading(false);
        }
        if (frameIndex < effectiveFrames) {
          video.currentTime = (frameIndex / effectiveFrames) * video.duration;
        } else {
          frameCache.set(key, extracted);
          setFrames([...extracted]);
          listeners.forEach((fn) => fn(extracted));
          frameCacheListeners.delete(key);
          saveToIDB(key, extracted);
          video.remove();
        }
      };

      video.addEventListener("seeked", extractFrame);

      // Use loadedmetadata (fires earlier than loadeddata on mobile)
      const onReady = () => {
        if (aborted) return;
        // iOS Safari: play+pause to unlock seeking
        const playPromise = video.play();
        if (playPromise) {
          playPromise.then(() => {
            video.pause();
            video.currentTime = 0;
          }).catch(() => {
            // Play blocked — try seeking directly
            video.currentTime = 0;
          });
        } else {
          video.currentTime = 0;
        }
      };

      if (video.readyState >= 1) {
        onReady();
      } else {
        video.addEventListener("loadedmetadata", onReady, { once: true });
        // Fallback timeout — if nothing fires in 5s, try anyway
        setTimeout(() => {
          if (extracted.length === 0 && !aborted && video.readyState >= 1) {
            onReady();
          }
        }, 5000);
      }
    });

    return () => {
      aborted = true;
      frameCacheListeners.delete(key);
    };
  }, [src, effectiveFrames, visible]);

  return { frames, loading, sentinelRef };
}

/* ─── Shared Spinner Canvas Logic ─── */
function useSpinnerLogic(frames: string[]) {
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIndexRef = useRef(0);
  const dragStartX = useRef(0);
  const dragStartFrame = useRef(0);
  const autoPlayRef = useRef<number | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesLoadedRef = useRef<HTMLImageElement[]>([]);
  const framesRef = useRef(frames);
  framesRef.current = frames;

  useEffect(() => {
    if (frames.length === 0) return;
    framesLoadedRef.current = frames.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }, [frames]);

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img = framesLoadedRef.current[index];
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (canvas.width !== (img.naturalWidth || img.width)) {
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };

  useEffect(() => {
    if (frames.length === 0) return;
    if (frames.length === 1) drawFrame(0);
    if (autoPlayRef.current) return;
    const startAutoPlay = () => {
      const interval = setInterval(() => {
        const total = framesRef.current.length;
        if (total === 0) return;
        frameIndexRef.current = (frameIndexRef.current + 1) % total;
        drawFrame(frameIndexRef.current);
      }, 55);
      autoPlayRef.current = interval as unknown as number;
    };
    const t = setTimeout(startAutoPlay, 100);
    return () => {
      clearTimeout(t);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [frames.length]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (frames.length === 0) return;
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setIsDragging(true);
    setShowHint(false);
    dragStartX.current = e.clientX;
    dragStartFrame.current = frameIndexRef.current;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const total = framesRef.current.length;
    if (!isDragging || total === 0) return;
    const container = containerRef.current;
    if (!container) return;
    const dx = e.clientX - dragStartX.current;
    const containerWidth = container.offsetWidth;
    const frameDelta = Math.round((dx / containerWidth) * total);
    let newIndex = (dragStartFrame.current + frameDelta) % total;
    if (newIndex < 0) newIndex += total;
    frameIndexRef.current = newIndex;
    drawFrame(newIndex);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    const total = framesRef.current.length;
    if (total === 0) return;
    resumeTimer.current = setTimeout(() => {
      const interval = setInterval(() => {
        const t = framesRef.current.length;
        if (t === 0) return;
        frameIndexRef.current = (frameIndexRef.current + 1) % t;
        drawFrame(frameIndexRef.current);
      }, 55);
      autoPlayRef.current = interval as unknown as number;
    }, 2000);
  };

  return {
    isDragging,
    showHint,
    containerRef,
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

/* ─── Bare Spinner Canvas (no wrapper panel) ─── */
function SpinnerCanvas({
  frames,
  loading,
  useBlendMode = false,
  className = "",
  hideHint = false,
}: {
  frames: string[];
  loading: boolean;
  useBlendMode?: boolean;
  className?: string;
  hideHint?: boolean;
}) {
  const {
    isDragging,
    showHint,
    containerRef,
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useSpinnerLogic(frames);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 85% at center, black 55%, transparent 90%)",
        maskImage:
          "radial-gradient(ellipse 80% 85% at center, black 55%, transparent 90%)",
      }}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-8 h-8 border-2 border-lff-cream/20 border-t-lff-cream/60 rounded-full"
          />
          <span className="text-lff-cream/30 text-[10px] tracking-[0.2em] uppercase">
            Loading 360
          </span>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain pointer-events-none"
          style={useBlendMode ? { mixBlendMode: "lighten" } : undefined}
        />
      )}
      <AnimatePresence>
        {showHint && !loading && !hideHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 text-lff-cream/30 text-[10px] tracking-[0.2em] uppercase"
            style={{
              borderRadius: PILL_RADIUS,
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            <RotateCcw size={10} />
            <span>Drag to spin</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Product Info Card (frosted glass) ─── */
function ProductInfoCard({
  overline,
  title,
  subtitle,
  price,
  stripeLink,
  shippingStripeLink,
  ctaLabel,
  stock,
  children,
  variant = "default",
}: {
  overline: string;
  title: string;
  subtitle: string;
  price: number;
  stripeLink?: string;
  shippingStripeLink?: string;
  ctaLabel: string;
  stock?: number | null;
  children?: React.ReactNode;
  variant?: "default" | "dark";
}) {
  const openModal = useContext(ShippingContext);
  const isLow = stock !== null && stock !== undefined && stock <= 15;
  const isDark = variant === "dark";

  // Dark variant: solid brown card for cream backgrounds
  const cardStyle = isDark
    ? {
        background: "rgba(58,44,30,0.92)",
        border: "1px solid rgba(84,65,47,0.3)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
        borderRadius: PANEL_RADIUS,
      }
    : frostedCard;

  return (
    <ScrollReveal>
      <div className="p-8 md:p-10 space-y-6" style={cardStyle}>
        <div>
          <p className="text-lff-cream/40 text-[10px] tracking-[0.35em] uppercase font-medium mb-3">
            {overline}
          </p>
          <h2
            className="text-lff-cream text-3xl md:text-4xl lg:text-5xl tracking-[-0.02em] leading-[0.95] mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <p className="text-lff-cream/55 text-sm tracking-wide font-light max-w-[35ch]">
            {subtitle}
          </p>
        </div>

        {children}

        {/* Price + stock */}
        <div className="flex items-center gap-4">
          <span
            className="text-lff-cream text-2xl tabular-nums"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ${price}
          </span>
          {stock !== null && stock !== undefined && (
            <div className="flex items-center gap-1.5">
              <BreathingDot color={isLow ? "#D4A574" : "#7CAE7A"} />
              <span className="text-[9px] tracking-[0.15em] uppercase text-lff-cream/45 font-medium">
                {isLow ? `${stock} left` : "In Stock"}
              </span>
            </div>
          )}
          {stock === null && (
            <span className="text-[9px] tracking-[0.15em] uppercase text-lff-cream/40 font-medium">
              Pre-Order
            </span>
          )}
        </div>

        {/* CTA */}
        {stripeLink && (
          <motion.button
            onClick={() =>
              openModal(
                title,
                price,
                stripeLink,
                shippingStripeLink || stripeLink, // fallback to same link if no shipping link set yet
              )
            }
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`inline-flex items-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 cursor-pointer ${
              isDark
                ? "bg-lff-cream text-lff-brown hover:bg-lff-cream/90"
                : "bg-lff-cream text-lff-brown hover:bg-lff-cream/90"
            }`}
            style={{ borderRadius: PILL_RADIUS }}
          >
            <ArrowRight size={13} />
            <span>{ctaLabel}</span>
          </motion.button>
        )}
      </div>
    </ScrollReveal>
  );
}

/* ─── Full-Width Image Break (parallax) ─── */
function ImageBreak({ src, alt, contain = false, bg }: { src: string; alt: string; contain?: boolean; bg?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div ref={ref} className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden" style={bg ? { backgroundColor: bg } : undefined}>
      <motion.img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full ${contain ? "h-full object-cover" : "h-[130%] object-cover"}`}
        style={contain ? { y, objectPosition: "center center" } : { y }}
      />
      {!contain && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(58,44,30,0.4) 0%, transparent 25%, transparent 75%, rgba(58,44,30,0.4) 100%)",
          }}
        />
      )}
    </div>
  );
}

/* ─── Marquee Banner ─── */
const MarqueeBanner = memo(function MarqueeBanner({
  items,
}: {
  items: string[];
}) {
  const doubled = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden py-4 select-none"
      style={{
        borderTop: "1px solid rgba(234,230,210,0.06)",
        borderBottom: "1px solid rgba(234,230,210,0.06)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(58,44,30,1), transparent)",
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, rgba(58,44,30,1), transparent)",
        }}
      />
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center whitespace-nowrap"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.5rem, 4vw, 3rem)",
              fontWeight: 900,
              letterSpacing: "-0.01em",
              textTransform: "uppercase" as const,
              color: "rgba(234,230,210,0.06)",
            }}
          >
            <span className="px-6 md:px-10">{item}</span>
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: "rgba(234,230,210,0.06)" }}
            />
          </span>
        ))}
      </div>
    </div>
  );
});

/* ─── Hero ─── */
function ShopHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);


  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] flex flex-col items-center justify-between overflow-hidden"
    >
      {/* Background — subway billboard */}
      <motion.div className="absolute inset-0" style={{ scale: bgScale }}>
        <video
          src="/shop/hero-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.45) contrast(1.1) saturate(0.6)", objectPosition: "center 55%" }}
        />
      </motion.div>

      {/* Subtle bottom fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent 50%, rgba(58,44,30,0.6) 100%)",
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: "300px 300px",
        }}
      />

      {/* Top text block — "REP THE" above the poster */}
      <motion.div
        className="relative z-10 text-center px-6 pt-[10vh] md:pt-[12vh]"
        style={{ opacity: textOpacity }}
      >
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-lff-cream/40 text-[11px] tracking-[0.4em] uppercase font-medium mb-4"
        >
          Official Merch · Limited Drop
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-lff-cream leading-[0.85] tracking-[-0.04em]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.5rem, 13vw, 12rem)",
          }}
        >
          REP THE
        </motion.h1>
      </motion.div>

      {/* Middle spacer — lets the poster breathe */}
      <div className="flex-1" />

      {/* Bottom text block — "BRAND" below the poster + CTA */}
      <motion.div
        className="relative z-10 text-center px-6 pb-6 md:pb-0 md:mb-[-2vh]"
        style={{ opacity: textOpacity }}
      >
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-lff-cream leading-[0.85] tracking-[-0.04em] mb-6"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.5rem, 13vw, 12rem)",
          }}
        >
          BRAND
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-lff-cream/50 text-sm md:text-base tracking-wide max-w-md mx-auto font-light mb-8"
        >
          Limited drops. Built for the gym. Worn everywhere.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <motion.a
            href="#shop"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-flex items-center gap-3 bg-lff-cream text-lff-brown px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase"
            style={{ borderRadius: PILL_RADIUS }}
          >
            <span>Shop Now</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </motion.a>
          <motion.a
            href="https://www.instagram.com/loverfighterfitness/"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-flex items-center gap-3 border border-lff-cream/20 text-lff-cream/60 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:border-lff-cream/40 hover:text-lff-cream transition-colors duration-300"
            style={{ borderRadius: PILL_RADIUS }}
          >
            <Instagram size={13} />
            <span>Follow</span>
          </motion.a>
        </motion.div>
      </motion.div>

    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   PRODUCT SECTIONS — Full Viewport, Alternating Layout
   ───────────────────────────────────────────────────────── */

/* ─── Tee Section (Info Left / Spinner Right) ─── */
function TeeSection() {
  const openShippingModal = useContext(ShippingContext);
  const [selectedColour, setSelectedColour] = useState<TeeColour>("brown");
  const videoSrc = TEE_SPIN_VIDEOS[selectedColour];
  const { frames, loading } = useVideoFrames(videoSrc, 48, true);

  const colourSwatches: { key: TeeColour; color: string; label: string }[] = [
    { key: "brown", color: "#54412F", label: "Brown" },
    { key: "black", color: "#1a1a1a", label: "Black" },
    { key: "cream", color: "#EAE6D2", label: "Cream" },
  ];

  return (
    <section className="lg:min-h-[100dvh] flex items-center px-4 md:px-8 lg:px-16 py-12 md:py-16 lg:py-0">
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
        {/* Info card — left 35% */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <ProductInfoCard
            overline="360 View · Pre-Order"
            title="DROP SHOULDER TEE"
            subtitle="Heavyweight garment-dyed cotton. Oversized fit. Double-sided print."
            price={45}
            stock={null}
            stripeLink="https://buy.stripe.com/cNi3cv9UKe236xm9Jmbwk0a"
            shippingStripeLink="https://buy.stripe.com/cNi00j0ka2jl1d27Bebwk0f"
            ctaLabel="Pre-Order — $45"
          >
            {/* Colour swatches */}
            <div>
              <p className="text-lff-cream/35 text-[9px] tracking-[0.3em] uppercase font-medium mb-3">
                Colour
              </p>
              <div className="flex items-center gap-4">
                {colourSwatches.map((swatch) => (
                  <button
                    key={swatch.key}
                    onClick={() => setSelectedColour(swatch.key)}
                    className="flex items-center gap-2 transition-all duration-300"
                    style={{
                      opacity: selectedColour === swatch.key ? 1 : 0.45,
                    }}
                  >
                    <span className="relative">
                      <span
                        className="block w-6 h-6 rounded-full border-2 transition-all duration-300"
                        style={{
                          backgroundColor: swatch.color,
                          borderColor:
                            selectedColour === swatch.key
                              ? "rgba(234,230,210,0.6)"
                              : "rgba(234,230,210,0.12)",
                          transform:
                            selectedColour === swatch.key
                              ? "scale(1.1)"
                              : "scale(1)",
                        }}
                      />
                      {selectedColour === swatch.key && (
                        <motion.span
                          layoutId="swatch-ring"
                          className="absolute -inset-[3px] rounded-full border border-lff-cream/25"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                        />
                      )}
                    </span>
                    <span className="text-lff-cream text-[10px] tracking-wider font-medium">
                      {swatch.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </ProductInfoCard>

          {/* 3-Pack Deal */}
          <ScrollReveal delay={0.15}>
            <div
              className="mt-4 p-5 md:p-6"
              style={{
                background: "rgba(234,230,210,0.08)",
                border: "1px solid rgba(234,230,210,0.1)",
                borderRadius: PANEL_RADIUS,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-lff-cream text-sm font-semibold tracking-wide">
                    3-Pack Bundle
                  </p>
                  <p className="text-lff-cream/40 text-xs mt-0.5">
                    One of each colour
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lff-cream/40 text-sm line-through mr-1.5" style={{ fontFamily: "var(--font-display)" }}>
                    $135
                  </span>
                  <span className="text-lff-cream text-xl" style={{ fontFamily: "var(--font-display)" }}>
                    $120
                  </span>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-green-400/70 font-medium">
                    Save $15
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() =>
                  openShippingModal(
                    "Drop Shoulder Tee — 3-Pack",
                    120,
                    "https://buy.stripe.com/bJe4gz5Eu3np8FuaNqbwk0g",
                    "https://buy.stripe.com/eVqcN5d6W5vx2h64p2bwk0h",
                  )
                }
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase bg-lff-cream text-lff-brown hover:bg-lff-cream/90 transition-colors duration-300 cursor-pointer"
                style={{ borderRadius: PILL_RADIUS }}
              >
                <ArrowRight size={13} />
                <span>Pre-Order 3-Pack — $120</span>
              </motion.button>
            </div>
          </ScrollReveal>
        </div>

        {/* Spinner — right 65%, floating on concrete */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <ScrollReveal delay={0.2}>
            <SpinnerCanvas
              frames={frames}
              loading={loading}
              className="w-full aspect-square max-w-[320px] lg:max-w-[700px] mx-auto"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ─── Straps Section (Spinner Left / Info Right) — CREAM BG ─── */
function StrapsSection() {
  const { frames, loading } = useVideoFrames(
    "/shop/straps-spin-blue.mp4",
    48,
    true,
    15,
    1.4,
    "blue",
  );

  return (
    <section
      className="relative lg:min-h-[100dvh] flex items-center px-4 md:px-8 lg:px-16 py-12 md:py-16 lg:py-0"
      style={{ backgroundColor: "#EAE6D2" }}
    >
      {/* Subtle noise texture on cream */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: "300px 300px",
        }}
      />
      <div className="relative w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
        {/* Spinner — left 65% */}
        <div className="lg:col-span-8">
          <ScrollReveal>
            <SpinnerCanvas
              frames={frames}
              loading={loading}
              className="w-full aspect-square max-w-[280px] lg:max-w-[650px] mx-auto"
            />
          </ScrollReveal>
        </div>

        {/* Info card — right 35%, brown card on cream bg */}
        <div className="lg:col-span-4">
          <ProductInfoCard
            overline="360 View · In Stock"
            title="LIFTING STRAPS"
            subtitle="Built to pull heavy. Premium construction with LFF branding."
            price={35}
            stock={15}
            stripeLink="https://buy.stripe.com/dRm8wP8QG9LN1d23kYbwk08"
            shippingStripeLink="https://buy.stripe.com/fZu00jgj86zBf3S4p2bwk0d"
            ctaLabel="Order — $35"
            variant="dark"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Cuffs Section (Info Left / Spinner Right) ─── */
function CuffsSection() {
  const { frames, loading } = useVideoFrames(
    "/shop/cuffs-spin-blue.mp4",
    48,
    true,
    20,
    4.0,
    "blue",
  );

  return (
    <section className="lg:min-h-[100dvh] flex items-center px-4 md:px-8 lg:px-16 py-12 md:py-16 lg:py-0">
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
        {/* Info card — left 35% */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <ProductInfoCard
            overline="360 View · In Stock"
            title="WRIST CUFFS"
            subtitle="Lock in. Lift more. Reinforced wrist support for heavy lifts."
            price={25}
            stock={15}
            stripeLink="https://buy.stripe.com/7sY4gz4Aq7DF8Fu1cQbwk09"
            shippingStripeLink="https://buy.stripe.com/fZu00j6Iy2jl8Fuf3Gbwk0e"
            ctaLabel="Order — $25"
          />
        </div>

        {/* Spinner — right 65% */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <ScrollReveal delay={0.2}>
            <SpinnerCanvas
              frames={frames}
              loading={loading}
              useBlendMode
              className="w-full aspect-square max-w-[280px] lg:max-w-[650px] mx-auto"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ─── Socks Section (Lifestyle Grid, cream bg) ─── */
function SocksSection() {
  return (
    <section className="relative py-20 md:py-28 px-4 md:px-8 lg:px-16" style={{ backgroundColor: "#EAE6D2" }}>
      {/* Noise on cream */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: "300px 300px",
        }}
      />
      <div className="relative max-w-[1400px] mx-auto">
        <ScrollReveal>
          <div className="mb-12">
            <p className="text-lff-brown/50 text-[10px] tracking-[0.35em] uppercase font-medium mb-3">
              In Stock
            </p>
            <h2
              className="text-lff-brown leading-[0.9] tracking-[-0.03em]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
              }}
            >
              CREW SOCKS
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-[800px]">
          {SOCKS.map((sock, i) => (
            <SockCard key={sock.id} product={sock} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── GOAT Pack Section ─── */
function GoatPackSection() {
  const openModal = useContext(ShippingContext);

  // Spinners — will use cache from individual sections above
  const { frames: teeFrames, loading: teeLoading } = useVideoFrames(
    TEE_SPIN_VIDEOS.brown, 48, true,
  );
  const { frames: strapsFrames, loading: strapsLoading } = useVideoFrames(
    "/shop/straps-spin-blue.mp4", 48, true, 15, 1.4, "blue",
  );
  const { frames: cuffsFrames, loading: cuffsLoading } = useVideoFrames(
    "/shop/cuffs-spin-blue.mp4", 48, true, 20, 1.5, "blue",
  );

  const fullPrice = 115;
  const packPrice = 99;

  return (
    <section className="py-20 md:py-28 px-4 md:px-8 lg:px-16" style={concreteTexture}>
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-6 md:mb-10">
            <p className="text-lff-cream/40 text-[10px] tracking-[0.35em] uppercase font-medium mb-3">
              The Ultimate Bundle
            </p>
            <h2
              className="text-lff-cream text-4xl md:text-5xl lg:text-7xl tracking-[-0.02em] leading-[0.95] mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              THE GOAT PACK
            </h2>
            <p className="text-lff-cream/50 text-sm tracking-wide max-w-[45ch] mx-auto">
              Everything you need. One price. No brainer.
            </p>
          </div>
        </ScrollReveal>

        {/* Three spinners centred */}
        <ScrollReveal delay={0.1}>
          <div className="flex items-center justify-center gap-0 md:gap-4 mb-8">
            <div className="flex-1 max-w-[300px]">
              <SpinnerCanvas frames={teeFrames} loading={teeLoading} useBlendMode hideHint className="w-full aspect-square" />
              <p className="text-center text-lff-cream/50 text-[10px] tracking-[0.2em] uppercase font-medium mt-1">Tee</p>
            </div>
            <span className="text-lff-cream/25 text-2xl md:text-3xl flex-shrink-0" style={{ fontFamily: "var(--font-display)" }}>+</span>
            <div className="flex-1 max-w-[300px]">
              <SpinnerCanvas frames={strapsFrames} loading={strapsLoading} useBlendMode hideHint className="w-full aspect-square" />
              <p className="text-center text-lff-cream/50 text-[10px] tracking-[0.2em] uppercase font-medium mt-1">Straps</p>
            </div>
            <span className="text-lff-cream/25 text-2xl md:text-3xl flex-shrink-0" style={{ fontFamily: "var(--font-display)" }}>+</span>
            <div className="flex-1 max-w-[300px]">
              <SpinnerCanvas frames={cuffsFrames} loading={cuffsLoading} useBlendMode hideHint className="w-full aspect-square" />
              <p className="text-center text-lff-cream/50 text-[10px] tracking-[0.2em] uppercase font-medium mt-1">Cuffs</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Price + socks + CTA */}
        <ScrollReveal delay={0.2}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mt-2">
            {/* Socks image + label */}
            <div className="flex items-center gap-4">
              <span
                className="text-lff-cream/25 text-2xl md:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                +
              </span>
              <div className="w-20 h-20 md:w-24 md:h-24 overflow-hidden rounded-xl flex-shrink-0">
                <img
                  src="/shop/socks-brown-hero.jpg"
                  alt="Brown Socks"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-lff-cream/50 text-[10px] tracking-[0.2em] uppercase font-medium">
                Socks
              </p>
            </div>

            {/* Price */}
            <div className="text-center">
              <div>
                <span
                  className="text-lff-cream/40 text-2xl line-through mr-3"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  ${fullPrice}
                </span>
                <span
                  className="text-lff-cream text-4xl md:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  ${packPrice}
                </span>
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-green-400/70 font-medium mt-1">
                Save ${fullPrice - packPrice}
              </p>
            </div>

            {/* CTA */}
            <motion.button
              onClick={() =>
                openModal(
                  "THE GOAT PACK",
                  packPrice,
                  "https://buy.stripe.com/7sY00jaYOe236xm08Mbwk0i",
                  "https://buy.stripe.com/9B65kDgj8e234pe9Jmbwk0j",
                )
              }
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="inline-flex items-center gap-3 px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-lff-cream text-lff-brown hover:bg-lff-cream/90 transition-colors duration-300 cursor-pointer"
              style={{ borderRadius: PILL_RADIUS }}
            >
              <ArrowRight size={13} />
              <span>Get the GOAT Pack — ${packPrice}</span>
            </motion.button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Coming Soon Section (Hoodie) ─── */
function ComingSoonSection() {
  return (
    <section className="py-20 md:py-28 px-4 md:px-8 lg:px-16">
      <div className="max-w-[1400px] mx-auto">
        <ScrollReveal>
          <div className="mb-10">
            <p className="text-lff-cream/40 text-[10px] tracking-[0.35em] uppercase font-medium mb-3">
              In Production
            </p>
            <h2
              className="text-lff-cream leading-[0.9] tracking-[-0.03em]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
              }}
            >
              COMING SOON
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div
            className="p-8 md:p-10 max-w-[500px]"
            style={frostedCard}
          >
            <div className="aspect-[4/5] mb-6 overflow-hidden flex items-center justify-center relative" style={{ borderRadius: "1.5rem", background: "linear-gradient(145deg, #3d2f20 0%, #2a1f14 60%, #1a150e 100%)" }}>
              <img
                src={LOGO_TRANSPARENT}
                alt=""
                className="w-16 h-16 object-contain opacity-[0.15]"
              />
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(42,31,20,0.3)" }}>
                <span className="text-lff-cream text-xs font-semibold tracking-[0.3em] uppercase drop-shadow-md">
                  Coming Soon
                </span>
              </div>
            </div>

            <h3
              className="text-lff-cream text-xl tracking-wide mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              REVERSIBLE HOODIE
            </h3>
            <p className="text-lff-cream/50 text-xs tracking-wider mb-3">
              Double-layer · Mocha
            </p>
            <div className="flex items-center justify-between">
              <span
                className="text-lff-cream text-lg tabular-nums"
                style={{ fontFamily: "var(--font-display)" }}
              >
                $90
              </span>
              <a
                href="https://www.instagram.com/loverfighterfitness/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[9px] tracking-[0.15em] uppercase text-lff-cream/45 font-medium hover:text-lff-cream/65 transition-colors"
              >
                <Instagram size={10} />
                <span>Notify Me</span>
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Pickup Info Strip ─── */
function PickupStrip() {
  return (
    <ScrollReveal className="px-4 md:px-8 lg:px-16 pb-8">
      <div className="max-w-[1400px] mx-auto">
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-8 py-5"
          style={{
            ...frostedCard,
            borderRadius: PANEL_RADIUS,
          }}
        >
          <p className="text-lff-cream/45 text-[10px] tracking-[0.2em] uppercase">
            Local pickup Mount Barker · Shipping Australia-wide
          </p>
          <a
            href="https://www.instagram.com/loverfighterfitness/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-lff-cream/55 text-[10px] tracking-[0.2em] uppercase font-medium hover:text-lff-cream transition-colors duration-300"
          >
            <Instagram size={12} />
            <span>DM to Order</span>
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ─── Brand Statement — Cream full-bleed section ─── */
function BrandStatement() {
  return (
    <section
      className="relative py-24 md:py-36 px-4 md:px-8 lg:px-16"
      style={{ backgroundColor: "#EAE6D2" }}
    >
      {/* Noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: "300px 300px",
        }}
      />
      <ScrollReveal>
        <div className="relative max-w-[900px] mx-auto text-center">
          {/* Watermark */}
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span
              className="font-black uppercase"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(8rem, 25vw, 20rem)",
                color: "rgba(84,65,47,0.04)",
                letterSpacing: "-0.05em",
              }}
            >
              LFF
            </span>
          </span>
          <div className="relative z-10">
            <p className="text-lff-brown/50 text-[10px] tracking-[0.35em] uppercase font-medium mb-6">
              The Philosophy
            </p>
            <p className="text-lff-brown/80 text-lg md:text-xl lg:text-2xl leading-relaxed font-light tracking-wide">
              Every piece is designed for people who train hard and look good doing it.
              Not fast fashion. Not overpriced hype.
            </p>
            <div
              className="w-10 h-[1px] mx-auto mt-8"
              style={{ backgroundColor: "rgba(84,65,47,0.15)" }}
            />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ─── Bottom Brand Strip ─── */
function BrandStrip() {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8 lg:px-16">
      <ScrollReveal>
        <div
          className="max-w-[800px] mx-auto text-center py-12 md:py-16 px-8 md:px-12"
          style={{ ...frostedCard, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
        >
          <img
            src={LOGO_TRANSPARENT}
            alt="LFF"
            className="h-12 w-auto mx-auto mb-8 opacity-25"
          />
          <p className="text-lff-cream/60 text-sm md:text-base leading-relaxed tracking-wide font-light mb-8">
            Quality gear that earns its place in your gym bag.
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[
              { href: "/", label: "Coaching" },
              {
                href: "https://www.instagram.com/loverfighterfitness/",
                label: "Instagram",
                external: true,
              },
              { href: "/calculator", label: "Calculator" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="text-lff-cream/45 text-[10px] tracking-[0.2em] uppercase font-medium hover:text-lff-cream/75 transition-colors duration-300 px-4 py-2"
                style={{
                  borderRadius: PILL_RADIUS,
                  border: "1px solid rgba(234,230,210,0.08)",
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN SHOP PAGE
   ═══════════════════════════════════════════════════════════ */
/* ─── Shipping Context ─── */
const ShippingContext = React.createContext<
  (name: string, price: number, pickupLink: string, shippingLink: string) => void
>(() => {});

export default function Shop() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [shippingModal, setShippingModal] = useState<ShippingModalState>({
    open: false,
    productName: "",
    price: 0,
    pickupLink: "",
    shippingLink: "",
  });

  const openShippingModal = (
    productName: string,
    price: number,
    pickupLink: string,
    shippingLink: string,
  ) => {
    setShippingModal({
      open: true,
      productName,
      price,
      pickupLink,
      shippingLink,
    });
  };

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (reduceMotion || isTouch) return;

    let rafId = 0;
    const onMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const el = spotlightRef.current;
        if (el) {
          el.style.transform = `translate3d(${e.clientX - 250}px, ${e.clientY - 250}px, 0)`;
          el.style.opacity = "0.18";
        }
        rafId = 0;
      });
    };
    const onLeave = () => {
      if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <ShippingContext.Provider value={openShippingModal}>
    <div className="min-h-screen text-lff-cream overflow-x-hidden" style={concreteTexture}>
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[2] opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: "180px 180px",
        }}
      />

      {/* Cursor spotlight */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[5] opacity-0 transition-opacity duration-300"
        style={{
          width: "500px",
          height: "500px",
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: "180px 180px",
          WebkitMaskImage:
            "radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, transparent 65%)",
          maskImage:
            "radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, transparent 65%)",
          mixBlendMode: "overlay",
          willChange: "transform",
        }}
      />

      <ShippingModal
        state={shippingModal}
        onClose={() => setShippingModal((s) => ({ ...s, open: false }))}
      />

      <Navbar />

      {/* Hero */}
      <ShopHero />

      {/* Marquee */}
      <MarqueeBanner
        items={[
          "NEW DROP",
          "LOVER FIGHTER FITNESS",
          "LIMITED STOCK",
          "REP THE BRAND",
          "EST. 2024",
        ]}
      />

      {/* ─── Product Gallery ─── */}
      <div id="shop">
        {/* Tees — Info Left / Spinner Right (brown bg) */}
        <TeeSection />

        {/* Full-bleed subway image — transition from brown to cream */}
        <ImageBreak src={BRAND_SUBWAY} alt="LFF Subway Billboard" />

        {/* Straps — Spinner Left / Info Right (CREAM bg) */}
        <StrapsSection />

        {/* Cuffs — Info Left / Spinner Right (back to brown) */}
        <CuffsSection />

        {/* Pickup strip */}
        <PickupStrip />

        {/* Socks — Lifestyle Grid (CREAM bg) */}
        <SocksSection />
      </div>

      {/* GOAT Pack Bundle */}
      <GoatPackSection />

      {/* Brand statement (CREAM full-bleed) */}
      <BrandStatement />

      {/* Marquee */}
      <MarqueeBanner
        items={[
          "NEW DROP",
          "LFF MERCH",
          "LIMITED STOCK",
          "REP THE BRAND",
          "LOVER FIGHTER FITNESS",
        ]}
      />

      {/* Coming Soon */}
      <ComingSoonSection />

      {/* Full-bleed brand image — centered logo on paper */}
      <ImageBreak src="/shop/logo-brown.jpg" alt="LFF Brand" contain bg="#e8e0cc" />

      {/* Bottom brand strip */}
      <BrandStrip />

      {/* Bottom Marquee */}
      <MarqueeBanner
        items={[
          "NEW DROP",
          "LOVER FIGHTER FITNESS",
          "LIMITED STOCK",
          "REP THE BRAND",
          "EST. 2024",
        ]}
      />

      <Footer />
    </div>
    </ShippingContext.Provider>
  );
}
