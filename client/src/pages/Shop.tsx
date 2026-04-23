/**
 * Shop — LFF Merch Storefront
 * Design: Full-viewport product gallery · Spinners float on concrete
 * Each product gets its own section with alternating left/right split
 * Frosted glass only on small info cards, never wrapping spinners
 */
import React, { useRef, useEffect, useState, memo, useContext, useCallback, createContext } from "react";
import {
  motion,
  AnimatePresence,
  useTransform,
  useScroll,
  useInView,
  useSpring,
} from "framer-motion";
import { ArrowRight, Instagram, RotateCcw, MapPin, Truck, X, ShoppingBag, ShoppingCart, Plus, Minus, Trash2, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

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

/* Tee lookbook photos — shown in lightbox when spinner is tapped */
type TeeSubject = "ruby" | "benny" | "both";
type TeeAngle = "front" | "back";
const TEE_PHOTOS: Record<TeeColour, Record<TeeSubject, Record<TeeAngle, string>>> = {
  brown: {
    ruby:  { front: "/shop/tee-brown-ruby.jpg",  back: "/shop/tee-brown-ruby-back.jpg"  },
    benny: { front: "/shop/tee-brown-benny.jpg", back: "/shop/tee-brown-benny-back.jpg" },
    both:  { front: "/shop/tee-brown-both.jpg",  back: "/shop/tee-brown-both-back.jpg"  },
  },
  black: {
    ruby:  { front: "/shop/tee-black-ruby.jpg",  back: "/shop/tee-black-ruby-back.jpg"  },
    benny: { front: "/shop/tee-black-benny.jpg", back: "/shop/tee-black-benny-back.jpg" },
    both:  { front: "/shop/tee-black-both.jpg",  back: "/shop/tee-black-both-back.jpg"  },
  },
  cream: {
    ruby:  { front: "/shop/tee-cream-ruby.jpg",  back: "/shop/tee-cream-ruby-back.jpg"  },
    benny: { front: "/shop/tee-cream-benny.jpg", back: "/shop/tee-cream-benny-back.jpg" },
    both:  { front: "/shop/tee-cream-both.jpg",  back: "/shop/tee-cream-both-back.jpg"  },
  },
};

/* ─── Tee Size & Stock ─── */
const TEE_SIZES = ["S", "M", "L", "XL", "2XL"] as const;
type TeeSize = (typeof TEE_SIZES)[number];

/* Size chart — measurements in cm, flat garment (Pure Blanks PB02 Heavy Box Tee) */
type SizeChartRow = {
  size: TeeSize;
  length: number;
  chest: number;
  sleeveLength: number;
  shoulderWidth: number;
  sleeveOpening: number;
};
const TEE_SIZE_CHART: SizeChartRow[] = [
  { size: "S",   length: 63.5, chest: 53, sleeveLength: 19.5, shoulderWidth: 52.5, sleeveOpening: 18.5 },
  { size: "M",   length: 66.5, chest: 56, sleeveLength: 21.5, shoulderWidth: 55,   sleeveOpening: 19.5 },
  { size: "L",   length: 69.5, chest: 59, sleeveLength: 23.5, shoulderWidth: 57.5, sleeveOpening: 20.5 },
  { size: "XL",  length: 72.5, chest: 62, sleeveLength: 25.5, shoulderWidth: 60,   sleeveOpening: 21.5 },
  { size: "2XL", length: 75.5, chest: 65, sleeveLength: 27.5, shoulderWidth: 62.5, sleeveOpening: 22.5 },
];

/** Hardcoded fallback stock — used while the API is loading */
const TEE_STOCK_FALLBACK: Record<TeeColour, Record<TeeSize, number>> = {
  brown: { S: 5, M: 7, L: 12, XL: 11, "2XL": 5 },
  cream: { S: 2, M: 3, L: 6, XL: 5, "2XL": 3 },
  black: { S: 3, M: 3, L: 6, XL: 5, "2XL": 3 },
};

const ACCESSORY_STOCK_FALLBACK: Record<string, number> = {
  "socks-cream": 30,
  "socks-brown": 30,
  "lifting-straps": 15,
  "wrist-cuffs": 15,
};

/* ─── Live Stock Context ─── */
interface StockData {
  teeStock: Record<TeeColour, Record<TeeSize, number>>;
  accessoryStock: Record<string, number>;
  isLoading: boolean;
}

const StockContext = createContext<StockData>({
  teeStock: TEE_STOCK_FALLBACK,
  accessoryStock: ACCESSORY_STOCK_FALLBACK,
  isLoading: true,
});

function useStockData(): StockData {
  const { data, isLoading } = trpc.shop.getStock.useQuery();

  if (!data || isLoading) {
    return {
      teeStock: TEE_STOCK_FALLBACK,
      accessoryStock: ACCESSORY_STOCK_FALLBACK,
      isLoading: true,
    };
  }

  // Build tee stock from live data
  const teeProduct = data.find((p) => p.slug === "drop-shoulder-tee");
  const teeStock: Record<TeeColour, Record<TeeSize, number>> = {
    brown: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 },
    cream: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 },
    black: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 },
  };

  if (teeProduct) {
    for (const v of teeProduct.variants) {
      const colour = v.colour as TeeColour | null;
      const size = v.size as TeeSize | null;
      if (colour && size && teeStock[colour] !== undefined) {
        teeStock[colour][size] = v.stock;
      }
    }
  }

  // Build accessory stock
  const accessoryStock: Record<string, number> = {};
  for (const product of data) {
    if (product.slug === "drop-shoulder-tee") continue;
    // Sum all variant stock for the product
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    accessoryStock[product.slug] = totalStock;
  }

  return { teeStock, accessoryStock, isLoading: false };
}

/* TEE_STOCK_FALLBACK is used by StockContext as the loading fallback */

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
  priceId: string;
  image?: string;
  hoverImage?: string;
  hoverVideo?: string;
  placeholderStyle?: React.CSSProperties;
}

/* ─── Cart Types & Context ─── */
interface CartItem {
  id: string;
  name: string;
  price: number;
  priceId: string;
  quantity: number;
  image?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  cartTotal: 0,
  cartCount: 0,
  isCartOpen: false,
  setCartOpen: () => {},
});

const CART_STORAGE_KEY = "lff-cart";

function useCartState(): CartContextType {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch { /* silent */ }
  }, [cartItems]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setCartItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    isCartOpen,
    setCartOpen,
  };
}

/* ─── Stripe Price IDs ─── */
const PRICE_IDS = {
  socksCream: "price_1TJP0dELc7CqpluZ2XgJcnke",
  socksBrown: "price_1TJP0eELc7CqpluZeQeIQm3B",
  liftingStraps: "price_1TJP0fELc7CqpluZACOnKwEj",
  cuffs: "price_1TJP0gELc7CqpluZtNGU2oTn",
  dropShoulderTee: "price_1TJSwbELc7CqpluZt72mBtdW",
  tee3Pack: "price_1TK7R7ELc7CqpluZYSUNLcWj",
  goatPack: "price_1TJoJJELc7CqpluZsFeM7SfV",
} as const;

/* ─── Product Catalog ─── */
const SOCKS: Product[] = [
  {
    id: "socks-cream",
    name: "LFF Crew Socks",
    tagline: "Cream",
    price: 10,
    stock: 30,
    priceId: PRICE_IDS.socksCream,
    image: "/shop/socks-cream-hero.jpg",
  },
  {
    id: "socks-brown",
    name: "LFF Crew Socks",
    tagline: "Brown",
    price: 10,
    stock: 30,
    priceId: PRICE_IDS.socksBrown,
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
    priceId: PRICE_IDS.liftingStraps,
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
    priceId: PRICE_IDS.cuffs,
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

const SHIPPING_COST = 10;

/* ─── Cart Drawer ─── */
function CartDrawer() {
  const {
    cartItems, cartTotal, cartCount, isCartOpen, setCartOpen,
    removeFromCart, updateQuantity, clearCart,
  } = useContext(CartContext);
  const [shipping, setShipping] = useState(false);
  const checkoutMutation = trpc.stripe.createShopCheckout.useMutation();

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isCartOpen]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    try {
      const result = await checkoutMutation.mutateAsync({
        items: cartItems.map((i) => ({ id: i.id, name: i.name, price: i.price, priceId: i.priceId, quantity: i.quantity })),
        shipping,
        origin: window.location.origin,
      });
      if (result.url) {
        clearCart();
        window.location.href = result.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  const total = cartTotal + (shipping ? SHIPPING_COST : 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999]"
          onClick={() => setCartOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-full max-w-[420px] flex flex-col"
            style={{
              background: "linear-gradient(180deg, rgba(48,36,24,0.98) 0%, rgba(58,44,30,0.98) 100%)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderLeft: "1px solid rgba(234,230,210,0.06)",
              boxShadow: "-32px 0 80px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(234,230,210,0.08)" }}
                >
                  <ShoppingBag size={14} className="text-lff-cream/70" />
                </div>
                <div>
                  <h3
                    className="text-lff-cream text-lg"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
                  >
                    YOUR CART
                  </h3>
                  {cartCount > 0 && (
                    <p className="text-lff-cream/30 text-[9px] tracking-[0.25em] uppercase">
                      {cartCount} {cartCount === 1 ? "item" : "items"}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lff-cream/30 hover:text-lff-cream hover:bg-lff-cream/8 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-7 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(234,230,210,0.1), transparent)" }} />

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-3">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(234,230,210,0.04)", border: "1px dashed rgba(234,230,210,0.08)" }}
                  >
                    <ShoppingBag size={28} className="text-lff-cream/12" />
                  </div>
                  <div>
                    <p className="text-lff-cream/30 text-sm tracking-wide mb-1">Nothing here yet</p>
                    <p className="text-lff-cream/15 text-xs">Add some gear to get started</p>
                  </div>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-2 px-6 py-2.5 text-[10px] tracking-[0.2em] uppercase font-bold text-lff-cream/60 hover:text-lff-cream border border-lff-cream/10 hover:border-lff-cream/25 transition-all"
                    style={{ borderRadius: PILL_RADIUS }}
                  >
                    Browse Shop
                  </button>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-4 p-3.5 rounded-2xl group/item"
                    style={{
                      background: "rgba(234,230,210,0.04)",
                      border: "1px solid rgba(234,230,210,0.05)",
                    }}
                  >
                    {/* Product image */}
                    {item.image && (
                      <div
                        className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0"
                        style={{ border: "1px solid rgba(234,230,210,0.06)" }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-lff-cream text-[13px] font-medium tracking-wide truncate">
                          {item.name}
                        </p>
                        <p
                          className="text-lff-cream/50 text-xs tabular-nums mt-0.5"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          ${item.price} each
                        </p>
                      </div>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="inline-flex items-center rounded-full overflow-hidden"
                          style={{
                            border: "1px solid rgba(234,230,210,0.1)",
                            background: "rgba(234,230,210,0.03)",
                          }}
                        >
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-lff-cream/40 hover:text-lff-cream hover:bg-lff-cream/8 transition-all"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-lff-cream text-xs tabular-nums w-7 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-lff-cream/40 hover:text-lff-cream hover:bg-lff-cream/8 transition-all"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto opacity-0 group-hover/item:opacity-100 text-lff-cream/20 hover:text-red-400/60 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-shrink-0 self-start">
                      <span
                        className="text-lff-cream text-sm tabular-nums font-medium"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        ${item.price * item.quantity}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer — shipping + total + checkout */}
            {cartItems.length > 0 && (
              <div className="px-7 pb-7 pt-5 space-y-4" style={{ borderTop: "1px solid rgba(234,230,210,0.06)" }}>
                {/* Shipping toggle */}
                <div className="space-y-2.5">
                  <p className="text-lff-cream/35 text-[9px] tracking-[0.3em] uppercase font-medium">
                    Delivery Method
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShipping(false)}
                      className="flex-1 flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 active:scale-[0.97]"
                      style={{
                        borderColor: !shipping ? "rgba(234,230,210,0.2)" : "rgba(234,230,210,0.06)",
                        background: !shipping ? "rgba(234,230,210,0.08)" : "rgba(234,230,210,0.02)",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: !shipping ? "rgba(234,230,210,0.12)" : "rgba(234,230,210,0.05)" }}
                      >
                        <MapPin size={12} className="text-lff-cream/60" />
                      </div>
                      <div className="text-left">
                        <p className="text-lff-cream text-xs font-medium">Pickup</p>
                        <p className="text-green-400/60 text-[9px] tracking-wider uppercase font-medium">
                          Free
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setShipping(true)}
                      className="flex-1 flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 active:scale-[0.97]"
                      style={{
                        borderColor: shipping ? "rgba(234,230,210,0.2)" : "rgba(234,230,210,0.06)",
                        background: shipping ? "rgba(234,230,210,0.08)" : "rgba(234,230,210,0.02)",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: shipping ? "rgba(234,230,210,0.12)" : "rgba(234,230,210,0.05)" }}
                      >
                        <Truck size={12} className="text-lff-cream/60" />
                      </div>
                      <div className="text-left">
                        <p className="text-lff-cream text-xs font-medium">Shipping</p>
                        <p className="text-lff-cream/35 text-[9px] tracking-wider uppercase font-medium">
                          +${SHIPPING_COST} AUD
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Totals */}
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{ background: "rgba(234,230,210,0.04)", border: "1px solid rgba(234,230,210,0.05)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lff-cream/40 text-[11px] tracking-wider">
                      Subtotal
                    </span>
                    <span className="text-lff-cream/55 text-sm tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                      ${cartTotal}
                    </span>
                  </div>
                  {shipping && (
                    <div className="flex items-center justify-between">
                      <span className="text-lff-cream/40 text-[11px] tracking-wider">
                        Shipping
                      </span>
                      <span className="text-lff-cream/55 text-sm tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                        ${SHIPPING_COST}
                      </span>
                    </div>
                  )}
                  <div
                    className="flex items-center justify-between pt-2.5 mt-1"
                    style={{ borderTop: "1px solid rgba(234,230,210,0.08)" }}
                  >
                    <span className="text-lff-cream text-xs font-medium tracking-[0.15em] uppercase">
                      Total
                    </span>
                    <span className="text-lff-cream text-2xl" style={{ fontFamily: "var(--font-display)" }}>
                      ${total}
                    </span>
                  </div>
                </div>

                {/* Checkout button */}
                <motion.button
                  onClick={handleCheckout}
                  disabled={checkoutMutation.isPending}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4.5 text-[11px] font-bold tracking-[0.2em] uppercase bg-lff-cream text-lff-brown hover:bg-lff-cream/90 transition-colors duration-300 cursor-pointer disabled:opacity-50"
                  style={{
                    borderRadius: PILL_RADIUS,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  {checkoutMutation.isPending ? (
                    <div className="relative overflow-hidden px-6">
                      <span className="opacity-0">Checkout — ${total}</span>
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(84,65,47,0.3) 50%, transparent 100%)",
                        }}
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      />
                    </div>
                  ) : (
                    <>
                      <ArrowRight size={13} />
                      <span>Checkout — ${total}</span>
                    </>
                  )}
                </motion.button>

                {/* Trust line */}
                <p className="text-center text-lff-cream/20 text-[9px] tracking-[0.15em] uppercase">
                  Secure checkout via Stripe
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Floating Cart Button ─── */
function FloatingCartButton() {
  const { cartCount, setCartOpen } = useContext(CartContext);
  const hasItems = cartCount > 0;

  return (
    <motion.button
      onClick={() => setCartOpen(true)}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 22 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      className="fixed bottom-6 right-6 z-[999] flex items-center gap-2 cursor-pointer px-4 py-3.5"
      style={{
        background: hasItems ? "rgba(234,230,210,0.95)" : "rgba(58,44,30,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: hasItems ? "1px solid rgba(84,65,47,0.15)" : "1px solid rgba(234,230,210,0.12)",
        boxShadow: hasItems
          ? "0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)"
          : "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        borderRadius: PILL_RADIUS,
      }}
    >
      <ShoppingCart size={18} className={hasItems ? "text-lff-brown" : "text-lff-cream/70"} />
      <AnimatePresence mode="wait">
        {hasItems && (
          <motion.span
            key={cartCount}
            initial={{ scale: 0, width: 0 }}
            animate={{ scale: 1, width: "auto" }}
            exit={{ scale: 0, width: 0 }}
            className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-lff-brown text-lff-cream text-[10px] font-bold px-1.5"
          >
            {cartCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── Checkout Success Toast ─── */
function CheckoutSuccessToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setShow(true);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.pathname);
      const t = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 px-6 py-4"
          style={{
            background: "rgba(58,44,30,0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(234,230,210,0.15)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            borderRadius: PILL_RADIUS,
          }}
        >
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check size={13} className="text-green-400" />
          </div>
          <span className="text-lff-cream text-sm font-medium tracking-wide">
            Order confirmed — you're repping the brand!
          </span>
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
  const [justAdded, setJustAdded] = useState(false);
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

  const { addToCart } = useContext(CartContext);

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
        onClick={() => {
          addToCart({
            id: product.id,
            name: `${product.name} — ${product.tagline}`,
            price: product.price,
            priceId: product.priceId,
            image: product.image,
          });
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1500);
        }}
        className="block relative overflow-hidden aspect-[4/5] cursor-pointer w-full text-left active:scale-[0.98] transition-transform"
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

        {/* Hover: Add to Cart pill slides up */}
        <div className={`absolute bottom-3 left-3 right-3 transition-transform duration-500 ease-out ${justAdded ? "translate-y-0" : "translate-y-[calc(100%+1rem)] group-hover:translate-y-0"}`}>
          <div
            className={`py-3 flex items-center justify-center gap-2 transition-colors duration-300 ${justAdded ? "bg-green-500/90 text-white" : "bg-lff-cream text-lff-brown"}`}
            style={{ borderRadius: PILL_RADIUS }}
          >
            {justAdded ? (
              <>
                <Check size={13} strokeWidth={2.5} />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase">
                  Added
                </span>
              </>
            ) : (
              <>
                <ShoppingBag size={12} strokeWidth={2.5} />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase">
                  Add to Cart
                </span>
              </>
            )}
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
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}
// Module-level fallback for non-hook contexts (frame extraction)
const IS_MOBILE_INITIAL = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
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
const CACHE_VERSION = "v7";

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
  const effectiveFrames = IS_MOBILE_INITIAL ? Math.min(frameCount, MOBILE_FRAMES) : frameCount;

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
        const maxDim = IS_MOBILE_INITIAL ? MOBILE_SCALE : DESKTOP_SCALE;
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
function useSpinnerLogic(frames: string[], onTap?: () => void) {
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIndexRef = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const movedDistance = useRef(0);
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
    dragStartY.current = e.clientY;
    movedDistance.current = 0;
    dragStartFrame.current = frameIndexRef.current;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const total = framesRef.current.length;
    if (!isDragging || total === 0) return;
    const container = containerRef.current;
    if (!container) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;
    movedDistance.current = Math.max(movedDistance.current, Math.abs(dx) + Math.abs(dy));
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
    // Tap detection: if pointer barely moved, treat as a tap
    if (onTap && movedDistance.current < 6) {
      onTap();
    }
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
  brightness,
  onTap,
  tapHint,
}: {
  frames: string[];
  loading: boolean;
  useBlendMode?: boolean;
  className?: string;
  hideHint?: boolean;
  brightness?: number;
  onTap?: () => void;
  tapHint?: string;
}) {
  const {
    isDragging,
    showHint,
    containerRef,
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useSpinnerLogic(frames, onTap);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        cursor: isDragging ? "grabbing" : onTap ? "pointer" : "grab",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 85% at center, black 55%, transparent 90%)",
        maskImage:
          "radial-gradient(ellipse 80% 85% at center, black 55%, transparent 90%)",
      }}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden" style={{ background: "rgba(234,230,210,0.06)" }}>
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(234,230,210,0.08) 50%, transparent 100%)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          </div>
          <span className="text-lff-cream/30 text-[10px] tracking-[0.2em] uppercase">
            Loading 360
          </span>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain pointer-events-none"
          style={{
            ...(useBlendMode ? { mixBlendMode: "lighten" as const } : {}),
            ...(brightness ? { filter: `brightness(${brightness})` } : {}),
          }}
        />
      )}
      <AnimatePresence>
        {showHint && !loading && !hideHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 text-lff-cream/30 text-[10px] tracking-[0.2em] uppercase"
            style={{
              borderRadius: PILL_RADIUS,
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            <RotateCcw size={10} />
            <span>{tapHint ?? "Drag to spin"}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Tee Photo Lightbox (Ruby / Benny / Both) ─── */
function TeePhotoLightbox({
  open,
  onClose,
  colour,
}: {
  open: boolean;
  onClose: () => void;
  colour: TeeColour;
}) {
  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const photos = TEE_PHOTOS[colour];
  const colourLabel = colour.charAt(0).toUpperCase() + colour.slice(1);
  const subjectOrder: { key: TeeSubject; label: string }[] = [
    { key: "ruby", label: "Ruby" },
    { key: "benny", label: "Benny" },
    { key: "both", label: "Both" },
  ];
  const angleOrder: { key: TeeAngle; label: string }[] = [
    { key: "front", label: "Front" },
    { key: "back", label: "Back" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col"
          style={{
            background: "rgba(15,12,9,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          onClick={onClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 shrink-0">
            <div className="flex items-center gap-3">
              <span
                className="block w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    colour === "brown" ? "#54412F" : colour === "black" ? "#1a1a1a" : "#EAE6D2",
                  border: "1px solid rgba(234,230,210,0.25)",
                }}
              />
              <p className="text-lff-cream/70 text-[10px] md:text-[11px] tracking-[0.3em] uppercase font-medium">
                {colourLabel} Tee · Lookbook
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 active:scale-90"
              style={{
                background: "rgba(234,230,210,0.08)",
                border: "1px solid rgba(234,230,210,0.18)",
              }}
              aria-label="Close"
            >
              <X size={16} className="text-lff-cream" />
            </button>
          </div>

          {/* Photo grid — Front row + Back row, each Ruby/Benny/Both */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-8 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-[1400px] mx-auto space-y-6">
              {angleOrder.map((angle, rowIdx) => (
                <div key={angle.key}>
                  <p className="text-lff-cream/40 text-[10px] tracking-[0.3em] uppercase font-medium mb-3">
                    {angle.label}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                    {subjectOrder.map((subject, colIdx) => {
                      const i = rowIdx * 3 + colIdx;
                      return (
                        <motion.div
                          key={`${angle.key}-${subject.key}`}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.05 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                          className="relative overflow-hidden"
                          style={{
                            borderRadius: 14,
                            background: "rgba(234,230,210,0.04)",
                            border: "1px solid rgba(234,230,210,0.08)",
                          }}
                        >
                          <img
                            src={photos[subject.key][angle.key]}
                            alt={`${colourLabel} tee on ${subject.label}, ${angle.label.toLowerCase()}`}
                            loading="lazy"
                            className="w-full h-full object-cover block"
                            style={{ aspectRatio: "3 / 4" }}
                          />
                          <div
                            className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between"
                            style={{
                              background:
                                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)",
                            }}
                          >
                            <span className="text-lff-cream text-[11px] tracking-[0.25em] uppercase font-semibold">
                              {subject.label}
                            </span>
                            <span className="text-lff-cream/55 text-[9px] tracking-[0.2em] uppercase">
                              {angle.label}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Size Chart Modal ─── */
function SizeChartModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const columns: { key: keyof Omit<SizeChartRow, "size">; label: string }[] = [
    { key: "length",         label: "Length" },
    { key: "chest",          label: "Chest" },
    { key: "shoulderWidth",  label: "Shoulder" },
    { key: "sleeveLength",   label: "Sleeve" },
    { key: "sleeveOpening",  label: "Cuff" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
          style={{
            background: "rgba(15,12,9,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[680px] max-h-[90vh] overflow-y-auto"
            style={{
              borderRadius: 16,
              background: "rgba(26,22,18,0.85)",
              border: "1px solid rgba(234,230,210,0.12)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 md:px-7 py-4 md:py-5 border-b border-lff-cream/10 sticky top-0 z-10"
              style={{ background: "rgba(26,22,18,0.95)" }}
            >
              <div>
                <p className="text-lff-cream/40 text-[9px] tracking-[0.3em] uppercase font-medium mb-1">
                  Drop Shoulder Tee
                </p>
                <p className="text-lff-cream text-[13px] md:text-[14px] tracking-[0.2em] uppercase font-semibold">
                  Size Guide
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 active:scale-90"
                style={{
                  background: "rgba(234,230,210,0.08)",
                  border: "1px solid rgba(234,230,210,0.18)",
                }}
                aria-label="Close"
              >
                <X size={16} className="text-lff-cream" />
              </button>
            </div>

            {/* Table */}
            <div className="px-5 md:px-7 py-5 md:py-6">
              <p className="text-lff-cream/45 text-[10px] tracking-[0.2em] uppercase font-medium mb-4">
                Flat garment measurements · cm
              </p>

              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full min-w-[480px] tabular-nums">
                  <thead>
                    <tr>
                      <th className="text-left text-lff-cream/50 text-[10px] tracking-[0.2em] uppercase font-semibold pb-3 pr-3">
                        Size
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="text-right text-lff-cream/50 text-[10px] tracking-[0.2em] uppercase font-semibold pb-3 px-2"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TEE_SIZE_CHART.map((row, idx) => (
                      <tr
                        key={row.size}
                        style={{
                          borderTop: idx === 0 ? "1px solid rgba(234,230,210,0.1)" : undefined,
                          borderBottom: "1px solid rgba(234,230,210,0.08)",
                        }}
                      >
                        <td className="py-3 pr-3 text-lff-cream text-[13px] tracking-[0.15em] font-bold">
                          {row.size}
                        </td>
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="py-3 px-2 text-right text-lff-cream/85 text-[13px]"
                          >
                            {row[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Measurement glossary */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {[
                  { label: "Length",   desc: "Collar seam to hem" },
                  { label: "Chest",    desc: "Pit to pit, flat" },
                  { label: "Shoulder", desc: "Seam to seam across back" },
                  { label: "Sleeve",   desc: "Shoulder seam to cuff" },
                  { label: "Cuff",     desc: "Opening width, flat" },
                ].map((g) => (
                  <div key={g.label} className="flex items-baseline gap-2">
                    <span className="text-lff-cream/70 text-[11px] tracking-[0.15em] uppercase font-semibold min-w-[60px]">
                      {g.label}
                    </span>
                    <span className="text-lff-cream/45 text-[11px] leading-snug">
                      {g.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Fit note */}
              <div
                className="mt-6 px-4 py-3 rounded-lg"
                style={{
                  background: "rgba(234,230,210,0.05)",
                  border: "1px solid rgba(234,230,210,0.08)",
                }}
              >
                <p className="text-lff-cream/65 text-[11px] leading-relaxed">
                  Oversized, boxy fit. If you're between sizes, size down for a cleaner silhouette or stay true for a relaxed drop. Allow 1–2cm margin on all measurements.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Product Info Card (frosted glass) ─── */
function ProductInfoCard({
  overline,
  title,
  subtitle,
  price,
  priceId,
  productId,
  ctaLabel,
  stock,
  image,
  children,
  variant = "default",
  onAddToCart,
  hidePrice = false,
}: {
  overline: string;
  title: string;
  subtitle: string;
  price: number;
  priceId?: string;
  productId?: string;
  ctaLabel: string;
  stock?: number | null;
  image?: string;
  children?: React.ReactNode;
  variant?: "default" | "dark";
  onAddToCart?: () => void;
  hidePrice?: boolean;
}) {
  const { addToCart } = useContext(CartContext);
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
        {!hidePrice && (
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
        )}

        {/* CTA */}
        {(priceId || onAddToCart) && (
          <motion.button
            onClick={() => {
              if (onAddToCart) {
                onAddToCart();
              } else if (priceId && productId) {
                addToCart({
                  id: productId,
                  name: title,
                  price,
                  priceId,
                  image,
                });
              }
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-flex items-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 cursor-pointer bg-lff-cream text-lff-brown hover:bg-lff-cream/90 active:scale-[0.97] active:-translate-y-[1px]"
            style={{ borderRadius: PILL_RADIUS }}
          >
            <ShoppingBag size={13} />
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
  bgColor = "rgba(58,44,30,1)",
  textColor = "rgba(234,230,210,0.18)",
}: {
  items: string[];
  bgColor?: string;
  textColor?: string;
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
          background: `linear-gradient(to right, ${bgColor}, transparent)`,
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to left, ${bgColor}, transparent)`,
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
              color: textColor,
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
        className="relative z-10 text-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-0 md:mb-[-2vh]"
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

/* ─── 3-Pack Size Selector ─── */
function ThreePackSelector({ addToCart }: { addToCart: (item: { id: string; name: string; price: number; priceId: string }) => void }) {
  const { teeStock } = useContext(StockContext);
  const [brownSize, setBrownSize] = useState<TeeSize | null>(null);
  const [creamSize, setCreamSize] = useState<TeeSize | null>(null);
  const [blackSize, setBlackSize] = useState<TeeSize | null>(null);

  const allSelected = brownSize && creamSize && blackSize;
  const canAdd = !!allSelected;

  const colourPicks: { colour: TeeColour; label: string; size: TeeSize | null; setSize: (s: TeeSize) => void }[] = [
    { colour: "brown", label: "Brown", size: brownSize, setSize: setBrownSize },
    { colour: "cream", label: "Cream", size: creamSize, setSize: setCreamSize },
    { colour: "black", label: "Black", size: blackSize, setSize: setBlackSize },
  ];

  return (
    <ScrollReveal delay={0.15}>
      <div
        className="mt-4 p-5 md:p-6"
        style={{
          background: "rgba(234,230,210,0.08)",
          border: "1px solid rgba(234,230,210,0.1)",
          borderRadius: PANEL_RADIUS,
        }}
      >
        {/* Header + price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lff-cream text-sm font-semibold tracking-wide">
              3-Pack Bundle
            </p>
            <p className="text-lff-cream/40 text-xs mt-0.5">
              One of each colour · Pick your sizes
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

        {/* Size selectors per colour */}
        <div className="space-y-3 mb-4">
          {colourPicks.map(({ colour, label, size, setSize }) => (
            <div key={colour}>
              <p className="text-lff-cream/50 text-[10px] tracking-[0.2em] uppercase font-medium mb-1.5">
                {label} Tee
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {TEE_SIZES.map((s) => {
                  const stock = teeStock[colour][s];
                  const soldOut = stock === 0;
                  const low = stock > 0 && stock <= 3;
                  const isSelected = size === s;

                  return (
                    <button
                      key={s}
                      disabled={soldOut}
                      onClick={() => setSize(s)}
                      className={`relative px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-200 active:scale-[0.95] active:-translate-y-[1px] ${
                        soldOut
                          ? "opacity-30 cursor-not-allowed line-through"
                          : isSelected
                            ? "bg-lff-cream text-lff-brown"
                            : "text-lff-cream/60 hover:text-lff-cream hover:border-lff-cream/30"
                      }`}
                      style={{
                        borderRadius: PILL_RADIUS,
                        border: isSelected ? "1px solid transparent" : "1px solid rgba(234,230,210,0.15)",
                      }}
                    >
                      {s}
                      {low && !isSelected && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                      )}
                    </button>
                  );
                })}
                {size && (
                  <span className="text-lff-cream/30 text-[9px] tracking-wider ml-1">
                    {teeStock[colour][size]} left
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={() => {
            if (!canAdd) return;
            addToCart({
              id: `tee-3-pack-${brownSize}-${creamSize}-${blackSize}`,
              name: `Tee 3-Pack — Brown ${brownSize}, Cream ${creamSize}, Black ${blackSize}`,
              price: 120,
              priceId: PRICE_IDS.tee3Pack,
            });
          }}
          whileHover={canAdd ? { scale: 1.03 } : {}}
          whileTap={canAdd ? { scale: 0.97 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${
            canAdd
              ? "bg-lff-cream text-lff-brown hover:bg-lff-cream/90 cursor-pointer"
              : "bg-lff-cream/20 text-lff-cream/30 cursor-not-allowed"
          }`}
          style={{ borderRadius: PILL_RADIUS }}
        >
          <ShoppingBag size={13} />
          <span>{canAdd ? "Add 3-Pack — $120" : "Select All 3 Sizes"}</span>
        </motion.button>
      </div>
    </ScrollReveal>
  );
}

/* ─── Tee Section (Info Left / Spinner Right) ─── */
function TeeSection() {
  const { addToCart } = useContext(CartContext);
  const { teeStock } = useContext(StockContext);
  const [selectedColour, setSelectedColour] = useState<TeeColour>("brown");
  const [selectedSize, setSelectedSize] = useState<TeeSize | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const videoSrc = TEE_SPIN_VIDEOS[selectedColour];
  const { frames, loading } = useVideoFrames(videoSrc, 48, true);

  const colourSwatches: { key: TeeColour; color: string; label: string }[] = [
    { key: "brown", color: "#54412F", label: "Brown" },
    { key: "black", color: "#1a1a1a", label: "Black" },
    { key: "cream", color: "#EAE6D2", label: "Cream" },
  ];

  const currentStock = selectedSize ? teeStock[selectedColour][selectedSize] : null;
  const isSoldOut = currentStock === 0;
  const isLowStock = currentStock !== null && currentStock > 0 && currentStock <= 3;
  const colourLabel = selectedColour.charAt(0).toUpperCase() + selectedColour.slice(1);

  const canAdd = selectedSize !== null && !isSoldOut;

  return (
    <section className="lg:min-h-[100dvh] flex items-center px-4 md:px-8 lg:px-16 py-12 md:py-16 lg:py-0">
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
        {/* Info card — left 35% */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <ProductInfoCard
            overline="360 View · In Stock"
            title="DROP SHOULDER TEE"
            subtitle="Heavyweight garment-dyed cotton. Oversized fit. Double-sided print."
            price={45}
            ctaLabel=""
            hidePrice
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
                    className="flex items-center gap-2 transition-all duration-300 active:scale-[0.93]"
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

            {/* Size selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-lff-cream/35 text-[9px] tracking-[0.3em] uppercase font-medium">
                  Size
                </p>
                <button
                  type="button"
                  onClick={() => setSizeChartOpen(true)}
                  className="text-lff-cream/55 hover:text-lff-cream/85 text-[9px] tracking-[0.25em] uppercase font-medium underline underline-offset-4 decoration-lff-cream/25 hover:decoration-lff-cream/60 transition-all duration-200"
                >
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {TEE_SIZES.map((size) => {
                  const stock = teeStock[selectedColour][size];
                  const soldOut = stock === 0;
                  const low = stock > 0 && stock <= 3;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      onClick={() => !soldOut && setSelectedSize(size)}
                      disabled={soldOut}
                      className="relative px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 active:scale-[0.95] active:-translate-y-[1px]"
                      style={{
                        borderRadius: PILL_RADIUS,
                        background: isSelected
                          ? "rgba(234,230,210,0.95)"
                          : "transparent",
                        color: isSelected
                          ? "#54412F"
                          : soldOut
                            ? "rgba(234,230,210,0.2)"
                            : "rgba(234,230,210,0.7)",
                        border: isSelected
                          ? "1px solid rgba(234,230,210,0.9)"
                          : "1px solid rgba(234,230,210,0.15)",
                        opacity: soldOut ? 0.4 : 1,
                        textDecoration: soldOut ? "line-through" : "none",
                        cursor: soldOut ? "not-allowed" : "pointer",
                      }}
                    >
                      {size}
                      {low && !isSelected && (
                        <span
                          className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#D4A574" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stock indicator for selected size */}
              <AnimatePresence mode="wait">
                {selectedSize && (
                  <motion.div
                    key={`${selectedColour}-${selectedSize}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 mt-3"
                  >
                    {isSoldOut ? (
                      <span className="text-[9px] tracking-[0.15em] uppercase text-red-400/80 font-medium">
                        Sold Out
                      </span>
                    ) : (
                      <>
                        <BreathingDot color={isLowStock ? "#D4A574" : "#7CAE7A"} />
                        <span className="text-[9px] tracking-[0.15em] uppercase text-lff-cream/45 font-medium">
                          {isLowStock
                            ? `${currentStock} left`
                            : `${currentStock} in stock`}
                        </span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span
                className="text-lff-cream text-2xl tabular-nums"
                style={{ fontFamily: "var(--font-display)" }}
              >
                $45
              </span>
            </div>

            {/* Custom CTA — replaces ProductInfoCard default */}
            <motion.button
              onClick={() => {
                if (!canAdd) return;
                addToCart({
                  id: `tee-${selectedColour}-${selectedSize}`,
                  name: `Drop Shoulder Tee — ${colourLabel} — ${selectedSize}`,
                  price: 45,
                  priceId: PRICE_IDS.dropShoulderTee,
                });
              }}
              whileHover={canAdd ? { scale: 1.03 } : {}}
              whileTap={canAdd ? { scale: 0.97 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-300"
              style={{
                borderRadius: PILL_RADIUS,
                background: canAdd
                  ? "rgba(234,230,210,0.95)"
                  : "rgba(234,230,210,0.15)",
                color: canAdd ? "#54412F" : "rgba(234,230,210,0.35)",
                cursor: canAdd ? "pointer" : "default",
              }}
            >
              <ShoppingBag size={13} />
              <span>
                {isSoldOut
                  ? "Sold Out"
                  : selectedSize
                    ? `Add to Cart — $45`
                    : "Select a Size"}
              </span>
            </motion.button>
          </ProductInfoCard>

          {/* 3-Pack Deal */}
          <ThreePackSelector addToCart={addToCart} />
        </div>

        {/* Spinner — right 65%, floating on concrete */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <ScrollReveal delay={0.2}>
            <SpinnerCanvas
              frames={frames}
              loading={loading}
              className="w-full aspect-square max-w-[320px] lg:max-w-[700px] mx-auto"
              onTap={() => setLightboxOpen(true)}
              tapHint="Tap to view · Drag to spin"
            />
          </ScrollReveal>
        </div>
      </div>

      <TeePhotoLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        colour={selectedColour}
      />

      <SizeChartModal
        open={sizeChartOpen}
        onClose={() => setSizeChartOpen(false)}
      />
    </section>
  );
}

/* ─── Straps Section (Spinner Left / Info Right) — CREAM BG ─── */
function StrapsSection() {
  const { accessoryStock } = useContext(StockContext);
  const strapsStock = accessoryStock["lifting-straps"] ?? 15;
  const { frames, loading } = useVideoFrames(
    "/shop/straps-spin-blue.mp4",
    48,
    true,
    15,
    1.4,
    "blue",
  );
  // Source video spins the opposite direction to tees + cuffs — reverse frames so all three match.
  const spinFrames = React.useMemo(() => [...frames].reverse(), [frames]);

  return (
    <section
      className="relative lg:min-h-[100dvh] flex items-center px-4 md:px-8 lg:px-16 py-12 md:py-16 lg:py-0"
      style={{ backgroundColor: "#EAE6D2" }}
    >
      <div className="relative w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
        {/* Spinner — left 65% */}
        <div className="lg:col-span-8">
          <ScrollReveal>
            <SpinnerCanvas
              frames={spinFrames}
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
            stock={strapsStock}
            priceId={PRICE_IDS.liftingStraps}
            productId="lifting-straps"
            image="/shop/straps-flatlay.jpg"
            ctaLabel="Add to Cart — $35"
            variant="dark"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Cuffs Section (Info Left / Spinner Right) ─── */
function CuffsSection() {
  const { accessoryStock } = useContext(StockContext);
  const cuffsStock = accessoryStock["wrist-cuffs"] ?? 15;
  const { frames, loading } = useVideoFrames(
    "/shop/cuffs-spin-blue.mp4",
    48,
    true,
    20,
    1,
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
            stock={cuffsStock}
            priceId={PRICE_IDS.cuffs}
            productId="cuffs"
            image="/shop/cuffs-flatlay.jpg"
            ctaLabel="Add to Cart — $25"
          />
        </div>

        {/* Spinner — right 65% */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <ScrollReveal delay={0.2}>
            <SpinnerCanvas
              frames={frames}
              loading={loading}
              useBlendMode
              brightness={1.65}
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
  const { accessoryStock } = useContext(StockContext);

  // Override hardcoded stock with live data
  const liveSocks = SOCKS.map((sock) => ({
    ...sock,
    stock: accessoryStock[sock.id] ?? sock.stock,
  }));

  return (
    <section className="relative py-20 md:py-28 px-4 md:px-8 lg:px-16" style={{ backgroundColor: "#EAE6D2" }}>
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
          {liveSocks.map((sock, i) => (
            <SockCard key={sock.id} product={sock} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── GOAT Pack Section ─── */
function GoatPackSection() {
  const { addToCart } = useContext(CartContext);

  // Spinners — will use cache from individual sections above
  const { frames: teeFrames, loading: teeLoading } = useVideoFrames(
    TEE_SPIN_VIDEOS.brown, 48, true,
  );
  const { frames: strapsFramesRaw, loading: strapsLoading } = useVideoFrames(
    "/shop/straps-spin-blue.mp4", 48, true, 15, 1.4, "blue",
  );
  // Source straps video spins opposite direction to tees + cuffs — reverse so all three match.
  const strapsFrames = React.useMemo(() => [...strapsFramesRaw].reverse(), [strapsFramesRaw]);
  const { frames: cuffsFrames, loading: cuffsLoading } = useVideoFrames(
    "/shop/cuffs-spin-blue.mp4", 48, true, 20, 1, "blue",
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
              <SpinnerCanvas frames={cuffsFrames} loading={cuffsLoading} useBlendMode hideHint brightness={1.65} className="w-full aspect-square" />
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
                addToCart({
                  id: "goat-pack",
                  name: "THE GOAT PACK",
                  price: packPrice,
                  priceId: PRICE_IDS.goatPack,
                  image: "/shop/socks-brown-hero.jpg",
                })
              }
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="inline-flex items-center gap-3 px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-lff-cream text-lff-brown hover:bg-lff-cream/90 transition-colors duration-300 cursor-pointer"
              style={{ borderRadius: PILL_RADIUS }}
            >
              <ShoppingBag size={13} />
              <span>Add GOAT Pack — ${packPrice}</span>
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
export default function Shop() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const cart = useCartState();

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

  const stockData = useStockData();

  return (
    <CartContext.Provider value={cart}>
    <StockContext.Provider value={stockData}>
    <div className="min-h-screen text-lff-cream overflow-x-hidden" style={concreteTexture}>
      {/* Checkout success toast */}
      <CheckoutSuccessToast />

      {/* Cart drawer */}
      <CartDrawer />

      {/* Floating cart button */}
      <FloatingCartButton />

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
          "EST. 2023",
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
          "EST. 2023",
        ]}
      />

      <Footer />
    </div>
    </StockContext.Provider>
    </CartContext.Provider>
  );
}
