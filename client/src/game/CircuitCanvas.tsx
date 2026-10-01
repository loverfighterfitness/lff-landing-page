import { TICK_MS } from "@shared/game/config";
import type { Character, LiftScores, RunLogs } from "@shared/game/types";
import { useEffect, useRef } from "react";
import { haptic, sfx } from "./audio";
import { Circuit } from "./circuit";
import { attachInput } from "./input";
import { PIXEL_RATIO } from "./poses";
import { drawFrame, loadPoses, VIEW_H, VIEW_W } from "./render";

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

    // Integer-scale the 180×320 view to fit the screen.
    const resize = () => {
      // Fit the phone screen; the canvas itself renders at 3× the logical grid so sprites stay crisp.
      const s = Math.min(window.innerWidth / VIEW_W, (window.innerHeight - 16) / VIEW_H);
      canvas.style.width = `${VIEW_W * s}px`;
      canvas.style.height = `${VIEW_H * s}px`;
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
      className="flex min-h-screen items-center justify-center select-none"
      style={{ touchAction: "none", backgroundColor: "#2e2318", WebkitUserSelect: "none" }}
    >
      <canvas ref={canvasRef} width={VIEW_W * PIXEL_RATIO} height={VIEW_H * PIXEL_RATIO} style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
