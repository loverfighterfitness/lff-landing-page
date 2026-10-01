import type { Character } from "@shared/game/types";
import type { CSSProperties, ReactNode } from "react";
import { poseUrl, type Pose, type SpriteId } from "../poses";

export const PIXEL_FONT = '"Press Start 2P", monospace';
export const GOLD = "#d4af37";
export const CREAM = "#EAE6D2";

/** Shared keyframes for every game screen (bob, blink, flash, slide). */
const KEYFRAMES = `
@keyframes lff-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
@keyframes lff-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0.15 } }
@keyframes lff-flash { 0% { opacity: 0.9 } 100% { opacity: 0 } }
@keyframes lff-slide-in { 0% { transform: translateX(-24px); opacity: 0 } 100% { transform: none; opacity: 1 } }
@keyframes lff-pop { 0% { transform: scale(0.6); opacity: 0 } 70% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
@keyframes lff-pulse { 0%, 100% { box-shadow: 0 0 0 2px ${GOLD}, 0 0 12px ${GOLD} } 50% { box-shadow: 0 0 0 2px ${GOLD}, 0 0 2px ${GOLD} } }
@keyframes lff-pan { 0% { background-position: 50% 0% } 100% { background-position: 50% 100% } }
`;

/** Full-screen game page over the pixel gym, dimmed so text reads. */
export function Screen({ children, dim = 0.6 }: { children: ReactNode; dim?: number }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-6 gap-5 relative overflow-hidden"
      style={{
        color: CREAM,
        fontFamily: PIXEL_FONT,
        backgroundColor: "#0d0b09",
        backgroundImage: `linear-gradient(rgba(0,0,0,${dim}), rgba(0,0,0,${Math.min(0.95, dim + 0.25)})), url(/game/gym_bg.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        imageRendering: "pixelated",
      }}
    >
      <style>{KEYFRAMES}</style>
      <div className="w-full max-w-md flex flex-col items-center gap-5 relative z-10">{children}</div>
    </div>
  );
}

/** Big arcade heading: gold with a hard dark outline and drop shadow. */
export function ArcadeTitle({ children, size = 18, colour = GOLD, style }: { children: ReactNode; size?: number; colour?: string; style?: CSSProperties }) {
  return (
    <h1
      className="text-center leading-relaxed"
      style={{
        fontSize: size,
        color: colour,
        textShadow: "2px 0 #1a120c, -2px 0 #1a120c, 0 2px #1a120c, 0 -2px #1a120c, 4px 4px 0 #000",
        letterSpacing: 1,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

/** Framed dark panel. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-full p-4 ${className}`}
      style={{
        backgroundColor: "rgba(12,10,8,0.85)",
        border: `3px solid ${CREAM}`,
        boxShadow: "inset 0 0 0 3px #1a120c, 6px 6px 0 rgba(0,0,0,0.6)",
      }}
    >
      {children}
    </div>
  );
}

/** A sprite pose as an <img>, pixel-crisp, optionally bobbing like an idle animation. */
export function Fighter({
  id,
  pose,
  height,
  bob = true,
  delay = 0,
  flip = false,
  style,
}: {
  id: SpriteId | Character;
  pose: Pose;
  height: number;
  bob?: boolean;
  delay?: number;
  flip?: boolean;
  style?: CSSProperties;
}) {
  return (
    <img
      src={poseUrl(id, pose)}
      alt=""
      draggable={false}
      style={{
        height,
        width: "auto",
        imageRendering: "pixelated",
        transform: flip ? "scaleX(-1)" : undefined,
        animation: bob ? `lff-bob 1.1s steps(2) ${delay}s infinite` : undefined,
        filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.45))",
        ...style,
      }}
    />
  );
}

export function PixelButton({
  children,
  onClick,
  disabled,
  variant = "cream",
  type = "button",
  big = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "cream" | "ghost" | "gold";
  type?: "button" | "submit";
  big?: boolean;
}) {
  const bg = variant === "cream" ? CREAM : variant === "gold" ? GOLD : "rgba(0,0,0,0.35)";
  const fg = variant === "ghost" ? CREAM : "#1a120c";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 ${big ? "py-4 text-sm" : "py-3 text-xs"} disabled:opacity-50 active:translate-y-0.5`}
      style={{
        fontFamily: PIXEL_FONT,
        backgroundColor: bg,
        color: fg,
        border: `3px solid ${variant === "gold" ? "#1a120c" : CREAM}`,
        boxShadow: variant === "ghost" ? "none" : "4px 4px 0 #000",
      }}
    >
      {children}
    </button>
  );
}
