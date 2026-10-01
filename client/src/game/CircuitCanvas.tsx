import { TICK_MS } from "@shared/game/config";
import type { Character, LiftScores, RunLogs } from "@shared/game/types";
import { useEffect, useRef } from "react";
import { sfx } from "./audio";
import { Circuit } from "./circuit";
import { attachInput } from "./input";
import { drawFrame, VIEW_H, VIEW_W } from "./render";

export type CircuitResult = { logs: RunLogs; scores: LiftScores; perfects: number };

/** Runs the 3-lift circuit on a pixel canvas. Calls `onFinish` once with the input logs and live scores. */
export default function CircuitCanvas({
  seed,
  character,
  gold,
  onFinish,
}: {
  seed: number;
  character: Character;
  gold: boolean;
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
    const circuit = new Circuit(seed, character);
    const detach = attachInput(wrap, (down) => circuit.setDown(down));

    // Integer-scale the 180×320 view to fit the screen.
    const resize = () => {
      const s = Math.max(1, Math.floor(Math.min(window.innerWidth / VIEW_W, (window.innerHeight - 16) / VIEW_H)));
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
        }
      }
      drawFrame(ctx, circuit, character, gold);
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
  }, [seed, character, gold]);

  return (
    <div
      ref={wrapRef}
      className="flex min-h-screen items-center justify-center select-none"
      style={{ touchAction: "none", backgroundColor: "#2e2318", WebkitUserSelect: "none" }}
    >
      <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
