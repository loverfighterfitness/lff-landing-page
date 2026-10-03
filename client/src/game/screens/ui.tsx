import type { Character } from "@shared/game/types";
import type { CSSProperties, ReactNode } from "react";
import { poseUrl, type Pose, type SpriteId } from "../poses";
import { BLUE, BROWN, CREAM, gameAsset, GRAIN, INK } from "../theme";

export const PIXEL_FONT = '"Press Start 2P", monospace';
export { BLUE, BROWN, CREAM, INK };

/** Shared keyframes for every game screen (bob, blink, flash, slide). */
const KEYFRAMES = `
@keyframes lff-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
@keyframes lff-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0.55 } }
@keyframes lff-flash { 0% { opacity: 0.9 } 100% { opacity: 0 } }
@keyframes lff-slide-in { 0% { transform: translateX(-24px); opacity: 0 } 100% { transform: none; opacity: 1 } }
@keyframes lff-pop { 0% { transform: scale(0.6); opacity: 0 } 70% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
@keyframes lff-pulse { 0%, 100% { box-shadow: 0 0 0 2px ${BLUE}, 0 0 12px ${BLUE} } 50% { box-shadow: 0 0 0 2px ${BLUE}, 0 0 2px ${BLUE} } }
@keyframes lff-pan { 0% { background-position: 50% 0% } 100% { background-position: 50% 100% } }
@keyframes lff-confetti { 0% { transform: translate(0, 0); opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)) rotate(200deg); opacity: 0 } }
@keyframes lff-cheer { 0%, 100% { transform: translateY(0) } 30% { transform: translateY(-14px) } 55% { transform: translateY(0) } 75% { transform: translateY(-6px) } }
@keyframes lff-handover { 0% { transform: translate(28px, -170px) scale(0.12) rotate(-28deg); opacity: 0 } 15% { opacity: 1 } 70% { transform: translate(0, 8px) scale(1.04) rotate(3deg) } 100% { transform: translate(0, 0) scale(1) rotate(0) } }
`;

/** Full-screen game page over the pixel gym, dimmed so text reads. */
export function Screen({ children, dim = 0.6, bg = gameAsset("gym_bg.png") }: { children: ReactNode; dim?: number; bg?: string }) {
  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center px-4 py-6 gap-5 relative overflow-hidden"
      style={{
        color: CREAM,
        fontFamily: PIXEL_FONT,
        backgroundColor: INK,
        backgroundImage: `linear-gradient(rgba(42,31,21,${dim}), rgba(20,14,9,${Math.min(0.95, dim + 0.3)})), url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        imageRendering: "pixelated",
      }}
    >
      <style>{KEYFRAMES}</style>
      {/* LFF film grain, same as the site and carousels. */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", opacity: 0.06 }} />
      <div className="w-full max-w-md flex flex-col items-center gap-5 relative z-10">{children}</div>
    </div>
  );
}

/** Big arcade heading: gold with a hard dark outline and drop shadow. */
export function ArcadeTitle({ children, size = 18, colour = CREAM, style }: { children: ReactNode; size?: number; colour?: string; style?: CSSProperties }) {
  return (
    <h1
      className="text-center leading-relaxed"
      style={{
        fontSize: size,
        color: colour,
        textShadow: `2px 0 ${INK}, -2px 0 ${INK}, 0 2px ${INK}, 0 -2px ${INK}, 4px 4px 0 ${BROWN}`,
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
        backgroundColor: "rgba(42,31,21,0.9)",
        border: `3px solid ${CREAM}`,
        boxShadow: `inset 0 0 0 3px ${BROWN}, 6px 6px 0 rgba(0,0,0,0.6)`,
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
  // "gold" is the hero button: cream with a baby-blue drop shadow.
  const bg = variant === "ghost" ? "rgba(42,31,21,0.6)" : CREAM;
  const fg = variant === "ghost" ? CREAM : INK;
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
        border: `3px solid ${variant === "gold" ? INK : CREAM}`,
        boxShadow: variant === "ghost" ? "none" : variant === "gold" ? `4px 4px 0 ${BLUE}` : `4px 4px 0 ${INK}`,
      }}
    >
      {children}
    </button>
  );
}
