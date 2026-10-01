import { TICK_MS } from "@shared/game/config";
import type { Character, LiftScores, RunLogs } from "@shared/game/types";
import { useEffect, useRef } from "react";
import { haptic, sfx } from "./audio";
import { Circuit } from "./circuit";
import { attachInput } from "./input";
import { PIXEL_RATIO } from "./poses";
import { drawFrame, loadPoses, VIEW_H, VIEW_W } from "./render";

/** Tallest view (logical px) before we letterbox; covers 9:21 phones. */
const MAX_VIEW_H = 420;

export type CircuitResult = { logs: RunLogs; scores: LiftScores; perfects: number };

/** Runs the 3-lift circuit on a pixel canvas. Calls `onFinish` once with the input logs and live scores. */
export default function CircuitCanvas({
  seed,
  character,
  onFinish,
}: {
  seed: number;
  character: Character;
  onFinish: (r: CircuitResult) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    void loadPoses();
    const circuit = new Circuit(seed, character);
    const detach = attachInput(wrap, (down) => circuit.setDown(down));

    // Fill the phone screen: the view is always 180 wide, and grows taller than 320 on tall phones
    // (capped so very tall windows letterbox). The canvas renders at 3× so sprites stay crisp.
    const resize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const h = Math.round(Math.min(MAX_VIEW_H, Math.max(VIEW_H, (VIEW_W * vh) / vw)));
      if (canvas.height !== h * PIXEL_RATIO) canvas.height = h * PIXEL_RATIO;
      const s = Math.min(vw / VIEW_W, vh / h);
      canvas.style.width = `${VIEW_W * s}px`;
      canvas.style.height = `${h * s}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let lastOutcomeKey = "";
    let finished = false;
    sfx("start");

    const frame = (now: number) => {
      acc += Math.min(250, now - last);
      last = now;
      while (acc >= TICK_MS && !circuit.done) {
        circuit.tick();
        acc -= TICK_MS;
      }
      const s = circuit.current?.state;
      if (s?.outcome) {
        const key = `${circuit.phase.kind === "lift" ? circuit.phase.lift : ""}:${s.outcomeTick}:${s.outcome}`;
        if (key !== lastOutcomeKey) {
          lastOutcomeKey = key;
          sfx(s.outcome === "formbreak" ? "miss" : s.outcome);
          if (s.outcome === "perfect") haptic(25);
          else if (s.outcome === "miss" || s.outcome === "formbreak" || s.outcome === "tut") haptic([40, 40, 40]);
        }
      }
      drawFrame(ctx, circuit, character);
      if (circuit.done && !finished) {
        finished = true;
        sfx("done");
        finishRef.current({ logs: circuit.logs(), scores: circuit.scores(), perfects: circuit.perfects() });
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      detach();
      window.removeEventListener("resize", resize);
    };
  }, [seed, character]);

  return (
    <div
      ref={wrapRef}
      className="flex h-[100dvh] items-center justify-center overflow-hidden select-none"
      style={{ touchAction: "none", backgroundColor: "#2e2318", WebkitUserSelect: "none" }}
    >
      <canvas ref={canvasRef} width={VIEW_W * PIXEL_RATIO} height={VIEW_H * PIXEL_RATIO} style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
