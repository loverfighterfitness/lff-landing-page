import { useEffect, useRef, useState, type ReactNode } from "react";
import { haptic, sfx } from "../audio";
import { BLUE, BROWN, CREAM, INK, TAUPE } from "../theme";
import { PIXEL_FONT } from "./ui";

/** Share of the foil that has to come off before the rest falls away. */
const REVEAL_AT = 0.45;

/**
 * A scratchie: `children` (the prize) sits under a foil the player scratches off with a finger.
 * Once enough is cleared the foil fades out and `onRevealed` fires.
 */
export default function ScratchTicket({ children, onRevealed }: { children: ReactNode; onRevealed: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const state = useRef({ down: false, last: null as { x: number; y: number } | null, strokes: 0, done: false });

  // Paint the foil.
  useEffect(() => {
    const wrap = wrapRef.current!;
    const cv = canvasRef.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // Layout size, not the on-screen box: the ticket is mid fly-in animation (scaled) when this runs.
    const width = wrap.offsetWidth;
    const height = wrap.offsetHeight;
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(height * dpr);
    const ctx = cv.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const paint = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = BROWN;
      ctx.fillRect(0, 0, width, height);
      // Pixel checker so it reads as foil.
      ctx.fillStyle = TAUPE;
      for (let y = 0; y < height; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < width; x += 8) ctx.fillRect(x, y, 4, 4);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = INK;
      ctx.fillRect(0, height / 2 - 14, width, 28);
      ctx.globalAlpha = 1;
      ctx.fillStyle = CREAM;
      ctx.font = `12px ${PIXEL_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SCRATCH ME", width / 2, height / 2 + 1);
    };
    paint();
    // The pixel font may still be loading on first paint: repaint once it's in (unless already scratched).
    void document.fonts?.load(`12px ${PIXEL_FONT}`).then(() => {
      if (!state.current.strokes) paint();
    });
  }, []);

  const reveal = () => {
    if (state.current.done) return;
    state.current.done = true;
    setRevealed(true);
    sfx("perfect");
    haptic([30, 40, 60]);
    onRevealed();
  };

  const clearedShare = () => {
    const cv = canvasRef.current!;
    const data = cv.getContext("2d")!.getImageData(0, 0, cv.width, cv.height).data;
    let clear = 0, n = 0;
    for (let i = 3; i < data.length; i += 4 * 16) {
      n++;
      if (data[i] === 0) clear++;
    }
    return clear / n;
  };

  const scratch = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.down || s.done) return;
    const cv = canvasRef.current!;
    const r = cv.getBoundingClientRect();
    const k = cv.offsetWidth / r.width;
    const p = { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
    const ctx = cv.getContext("2d")!;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo((s.last ?? p).x, (s.last ?? p).y);
    ctx.lineTo(p.x + 0.1, p.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    s.last = p;
    if (++s.strokes % 6 === 0) {
      if (s.strokes % 12 === 0) haptic(5);
      if (clearedShare() >= REVEAL_AT) reveal();
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none"
      style={{
        backgroundColor: CREAM,
        color: INK,
        padding: "10px 14px",
        // Ticket notches on both sides and a perforated inner edge.
        WebkitMask: "radial-gradient(circle 10px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 10px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat",
        mask: "radial-gradient(circle 10px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 10px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat",
        boxShadow: `inset 0 0 0 3px ${CREAM}, inset 0 0 0 5px ${BROWN}`,
        minHeight: 104,
      }}
    >
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        onPointerDown={(e) => {
          state.current.down = true;
          state.current.last = null;
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          scratch(e);
        }}
        onPointerMove={scratch}
        onPointerUp={() => {
          state.current.down = false;
          state.current.last = null;
        }}
        className="absolute inset-0 w-full h-full"
        style={{
          touchAction: "none",
          cursor: "grab",
          opacity: revealed ? 0 : 1,
          transition: "opacity 0.5s ease-out",
          pointerEvents: revealed ? "none" : "auto",
        }}
      />
      {!revealed && (
        <button type="button" onClick={reveal} className="sr-only">
          Reveal prize
        </button>
      )}
      {revealed && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              className="absolute block"
              style={{
                left: `${(i * 37) % 100}%`,
                top: "50%",
                width: 6,
                height: 6,
                backgroundColor: [BLUE, BROWN, TAUPE][i % 3],
                animation: `lff-confetti 0.9s ease-out ${(i % 6) * 0.04}s both`,
                ["--dx" as string]: `${((i * 53) % 120) - 60}px`,
                ["--dy" as string]: `${-40 - ((i * 29) % 70)}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
