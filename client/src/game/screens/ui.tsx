import type { ReactNode } from "react";

export const PIXEL_FONT = '"Press Start 2P", monospace';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-8 gap-6"
      style={{ backgroundColor: "#54412F", color: "#EAE6D2", fontFamily: PIXEL_FONT }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6">{children}</div>
    </div>
  );
}

export function PixelButton({
  children,
  onClick,
  disabled,
  variant = "cream",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "cream" | "ghost";
  type?: "button" | "submit";
}) {
  const cream = variant === "cream";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full px-4 py-3 text-xs disabled:opacity-50 active:translate-y-0.5"
      style={{
        fontFamily: PIXEL_FONT,
        backgroundColor: cream ? "#EAE6D2" : "transparent",
        color: cream ? "#54412F" : "#EAE6D2",
        border: "3px solid #EAE6D2",
        boxShadow: cream ? "4px 4px 0 #2e2318" : "none",
      }}
    >
      {children}
    </button>
  );
}
