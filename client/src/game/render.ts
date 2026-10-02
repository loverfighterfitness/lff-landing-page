import type { BenchState } from "@shared/game/bench";
import { BENCH, DEADLIFT, SQUAT } from "@shared/game/config";
import { DEADLIFT_CENTRE, type DeadliftState } from "@shared/game/deadlift";
import type { LiftStateBase } from "@shared/game/lift";
import type { SquatState } from "@shared/game/squat";
import type { Character } from "@shared/game/types";
import type { Circuit } from "./circuit";
import { INTRO_TICKS } from "./circuit";
import {
  BENNY_3_PLATES_DONE,
  BENNY_3_PLATES_LOADING,
  BENNY_BANTER_REPLY,
  CHARACTER_INFO,
  LEVI_REPLY_WHOLE_FOODS,
  LIFT_NAMES,
  LIFT_TIPS,
  POPUPS,
  TUT_LINE,
  WHOLE_FOODS_BRO,
} from "./content";
import {
  drawBackground,
  drawPlateEndOn,
  drawPlatesFront,
  drawPose,
  PIXEL_RATIO,
  poseHeight,
  SPRITE_SCALE,
} from "./poses";

export { loadPoses } from "./poses";

export const VIEW_W = 180;
export const VIEW_H = 320;

import { BAD, BLUE, BROWN, CREAM, INK, STONE, TAUPE } from "./theme";

const DARK = INK;
const FONT = '"Press Start 2P", monospace';
const SCALE = 3;
const POPUP_TICKS = 70;

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size = 8, colour = CREAM, align: CanvasTextAlign = "center") {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillStyle = DARK;
  ctx.fillText(s, x + 1, y + 1);
  ctx.fillStyle = colour;
  ctx.fillText(s, x, y);
}

/** Text on a small ink plate, for labels that sit over the busy gym wall. */
function tag(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size = 8, colour = CREAM) {
  ctx.font = `${size}px ${FONT}`;
  const w = ctx.measureText(s).width;
  ctx.fillStyle = "rgba(42,31,21,0.85)";
  ctx.fillRect(Math.round(x - w / 2 - 4), y - 3, Math.round(w + 8), size + 6);
  text(ctx, s, x, y, size, colour);
}

/** Word-wrap into lines that fit `maxW`. */
function wrap(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, maxW: number, size = 6, colour = CREAM) {
  ctx.font = `${size}px ${FONT}`;
  const words = s.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      text(ctx, line, x, yy, size, colour);
      line = w;
      yy += size + 4;
    } else line = test;
  }
  if (line) text(ctx, line, x, yy, size, colour);
}

/** The pixel-art gym, with a dark gradient behind the HUD and meters so text stays readable. */
function background(ctx: CanvasRenderingContext2D, h: number) {
  if (!drawBackground(ctx)) {
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, VIEW_W, h);
  }
  const top = ctx.createLinearGradient(0, 0, 0, 56);
  top.addColorStop(0, "rgba(0,0,0,0.75)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, VIEW_W, 56);
  const y0 = h - (VIEW_H - 244);
  const bottom = ctx.createLinearGradient(0, y0, 0, h);
  bottom.addColorStop(0, "rgba(0,0,0,0)");
  bottom.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, y0, VIEW_W, h - y0);
}

/** A framed pixel panel for meters. */
function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha = 0.86) {
  ctx.fillStyle = `rgba(42,31,21,${alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(234,230,210,0.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/** Top bar. `bar` is an optional 0..1 countdown (the squat's rep clock); lifts are max-outs, not timed. */
function hud(ctx: CanvasRenderingContext2D, c: Circuit, s: LiftStateBase, bar: number | null, lift: string) {
  text(ctx, lift, 6, 6, 8, CREAM, "left");
  const done = c.scores();
  const total = done.bench + done.squat + done.deadlift + s.score;
  text(ctx, `BEST ${s.score}KG`, 6, 18, 7, BLUE, "left");
  text(ctx, `TOTAL ${total}KG`, VIEW_W - 6, 18, 6, CREAM, "right");
  if (s.combo > 1) text(ctx, `STREAK ${s.combo}`, VIEW_W - 6, 30, 6, BLUE, "right");
  if (bar === null) return;
  ctx.fillStyle = DARK;
  ctx.fillRect(6, 30, 100, 4);
  ctx.fillStyle = bar < 0.3 ? BAD : CREAM;
  ctx.fillRect(6, 30, Math.max(0, 100 * bar), 4);
}

/** Small pixel-Levi cameo (TUT trap, Benny banter, whole-foods bit). */
function miniLevi(ctx: CanvasRenderingContext2D, x: number, floorY: number, scale = 1) {
  drawPose(ctx, "levi", "stance", x, floorY, { scale });
}

function popup(ctx: CanvasRenderingContext2D, s: LiftStateBase, character: Character) {
  if (!s.outcome) return;
  const age = s.tick - s.outcomeTick;
  if (age > POPUP_TICKS) return;
  const y = 62 - Math.floor(age / 5);
  if (s.outcome === "tut") {
    miniLevi(ctx, 22, 124);
    wrap(ctx, TUT_LINE, 104, 74, 130, 6, CREAM);
    text(ctx, `-50`, VIEW_W / 2, y + 40, 8, BAD);
    return;
  }
  const pool = s.outcome === "perfect" ? CHARACTER_INFO[character].perfectQuotes : POPUPS[s.outcome];
  const line = pool[s.outcomeTick % pool.length];
  const colour = s.outcome === "perfect" ? BLUE : s.outcome === "good" ? CREAM : BAD;
  ctx.font = `8px ${FONT}`;
  if (ctx.measureText(line).width > 168) wrap(ctx, line, VIEW_W / 2, y, 168, 6, colour);
  else tag(ctx, line, VIEW_W / 2, y, 8, colour);
  if (character === "benny" && s.outcome === "perfect" && s.outcomeTick % 3 === 0) {
    miniLevi(ctx, 14, y + 44, 0.5);
    wrap(ctx, BENNY_BANTER_REPLY, 100, y + 16, 140, 5, CREAM);
  }
}

const FLOOR = 236;

/** Lifter sprite scale: a touch bigger on tall phones, where there's room for it. Set per frame. */
let liftScale = SPRITE_SCALE;

/** Bar whip after a heavy rep (sprite px for the plates): a quick damped bounce, bigger with kg. */
function whip(cooldown: number, cooldownTicks: number, kg: number): number {
  if (cooldown <= 0) return 0;
  const age = cooldownTicks - cooldown;
  const amp = Math.min(2, Math.max(0, (kg - 60) / 50));
  return amp * Math.sin(age * 0.7) * Math.exp(-age / 14);
}

/** Pick one of three frames for a 0..1 movement (0 = start, 1 = end). */
function frame3<T>(t: number, a: T, b: T, c: T): T {
  return t < 0.34 ? a : t < 0.67 ? b : c;
}

function drawBench(ctx: CanvasRenderingContext2D, s: BenchState, character: Character) {
  // Side-on. During a rep the bar comes down to the chest and back up (1 = touching).
  const depth = s.cooldown > 0 && s.outcome !== "miss" ? Math.sin((s.cooldown / BENCH.cooldownTicks) * Math.PI) : 0;
  const pose = frame3(depth, "bench_up" as const, "bench_mid" as const, "bench_down" as const);
  const placed = drawPose(ctx, character, pose, 40 - (liftScale - SPRITE_SCALE) * 20, FLOOR, { anchor: "left", scale: liftScale });
  drawPlateEndOn(ctx, placed, s.kg);
  tag(ctx, `${s.kg}KG`, 64, FLOOR - poseHeight(character, "bench_up", liftScale) - 16, 6, CREAM);
  // Timing meter.
  const mx = 20, my = 262, mw = 140, mh = 14;
  panel(ctx, mx - 4, my - 4, mw + 8, mh + 22);
  // Track ink, zone taupe, perfect band baby blue: each step clearly distinct.
  ctx.fillStyle = INK;
  ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = TAUPE;
  ctx.fillRect(mx + (s.zoneCenter - s.zoneWidth / 2) * mw, my, s.zoneWidth * mw, mh);
  const pw = s.zoneWidth * BENCH.perfectFraction;
  ctx.fillStyle = BLUE;
  ctx.fillRect(mx + (s.zoneCenter - pw / 2) * mw, my, pw * mw, mh);
  ctx.fillStyle = INK;
  ctx.fillRect(mx + s.pos * mw - 2, my - 4, 5, mh + 8);
  ctx.fillStyle = CREAM;
  ctx.fillRect(mx + s.pos * mw - 1, my - 3, 3, mh + 6);
  for (let i = 0; i < BENCH.maxMisses; i++) {
    ctx.fillStyle = i < s.misses ? BAD : TAUPE;
    ctx.fillRect(mx + i * 10, my + mh + 4, 7, 4);
  }
  // Benny's 3-plate quest.
  if (character === "benny") {
    if (s.kg === 140) wrap(ctx, BENNY_3_PLATES_LOADING, VIEW_W / 2, 42, 160, 6, BLUE);
    if (s.bestKg === 140 && s.outcome === "perfect" && s.tick - s.outcomeTick < 90) {
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = [BLUE, CREAM, STONE, TAUPE][i % 4];
        ctx.fillRect((i * 37 + s.tick * 3) % VIEW_W, (i * 53 + s.tick * 2) % 220, 3, 3);
      }
      text(ctx, BENNY_3_PLATES_DONE, VIEW_W / 2, 42, 6, BLUE);
    }
  }
}

function drawSquat(ctx: CanvasRenderingContext2D, s: SquatState, character: Character) {
  // progress 0 = bottom of the hole, 1 = standing; stand tall during the rep cooldown.
  const up = s.cooldown > 0 ? 1 : s.progress;
  const pose = frame3(up, "squat_bottom" as const, "squat_mid" as const, "squat_top" as const);
  const kg = s.kg;
  drawPlatesFront(ctx, drawPose(ctx, character, pose, VIEW_W / 2, FLOOR, { scale: liftScale }), kg, whip(s.cooldown, SQUAT.cooldownTicks, kg));
  tag(ctx, `${kg}KG`, VIEW_W / 2, 100, 8);
  // Drive meter (left) and form meter (right).
  const mh = 120, my = 104;
  panel(ctx, 5, my - 14, 16, mh + 18);
  panel(ctx, VIEW_W - 21, my - 14, 16, mh + 18);
  ctx.fillStyle = INK;
  ctx.fillRect(9, my, 8, mh);
  ctx.fillRect(VIEW_W - 17, my, 8, mh);
  ctx.fillStyle = CREAM;
  ctx.fillRect(9, my + mh * (1 - s.progress), 8, mh * s.progress);
  ctx.fillStyle = s.strain > 0.6 ? BAD : s.strain > 0.3 ? TAUPE : STONE;
  ctx.fillRect(VIEW_W - 17, my + mh * (1 - Math.min(1, s.strain)), 8, mh * Math.min(1, s.strain));
  text(ctx, "UP", 13, my - 10, 5);
  text(ctx, "FORM", VIEW_W - 13, my - 10, 4);
  // Beat ring: closes on the dot when the next tap is due; the dot shows how on-beat the last tap was.
  const bx = VIEW_W / 2, by = 258;
  const since = s.tick - s.lastPressTick;
  if (s.repStart >= 0 && s.cooldown === 0) {
    const r = Math.max(3, 14 * (1 - since / SQUAT.tempoTicks));
    ctx.strokeStyle = since >= SQUAT.tempoTicks - 1 && since <= SQUAT.tempoTicks + 1 ? BLUE : STONE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = s.repStart < 0 ? TAUPE : s.beat >= SQUAT.perfectTempo ? BLUE : s.beat > 0.3 ? CREAM : BAD;
  ctx.fillRect(bx - 2, by - 2, 5, 5);
  text(ctx, `REPS ${s.reps}`, VIEW_W / 2, 276, 8);
}

function drawDeadlift(ctx: CanvasRenderingContext2D, s: DeadliftState, character: Character) {
  const lockedOut = s.cooldown > 0;
  const up = lockedOut ? 1 : s.pulling ? s.gauge / DEADLIFT.sweetMin : 0;
  const pose = frame3(up, "dl_bottom" as const, "dl_mid" as const, "dl_top" as const);
  // During lockout the bar shows the weight just lifted; otherwise what's loaded.
  const kg = lockedOut ? s.bestKg : s.kg;
  drawPlatesFront(ctx, drawPose(ctx, character, pose, VIEW_W / 2 - 6, FLOOR, { scale: liftScale }), kg, whip(s.cooldown, DEADLIFT.cooldownTicks, kg));
  tag(ctx, lockedOut ? `NEXT ${s.kg}KG` : `${s.kg}KG`, VIEW_W / 2, 100, 8);
  // Power gauge.
  const gx = VIEW_W - 22, gy = 100, gh = 120;
  panel(ctx, gx - 4, gy - 4, 22, gh + 8);
  ctx.fillStyle = INK;
  ctx.fillRect(gx, gy, 14, gh);
  ctx.fillStyle = TAUPE;
  ctx.fillRect(gx + 1, gy + gh * (1 - DEADLIFT.sweetMax), 12, gh * (DEADLIFT.sweetMax - DEADLIFT.sweetMin));
  ctx.fillStyle = BLUE;
  ctx.fillRect(gx + 1, gy + gh * (1 - DEADLIFT_CENTRE - DEADLIFT.perfectHalfWidth), 12, gh * DEADLIFT.perfectHalfWidth * 2);
  ctx.fillStyle = INK;
  ctx.fillRect(gx - 4, gy + gh * (1 - s.gauge) - 2, 22, 5);
  ctx.fillStyle = CREAM;
  ctx.fillRect(gx - 3, gy + gh * (1 - s.gauge) - 1, 20, 3);
  if (s.needRelease) text(ctx, "LET GO, RESET", VIEW_W / 2, 268, 6);
  else if (!s.pulling && !lockedOut) text(ctx, "HOLD TO PULL", VIEW_W / 2, 268, 6);
  text(ctx, `BEST ${s.bestKg}KG`, VIEW_W / 2, 284, 6);
}

/** A tiny looping demo of the lift's control, shown during the countdown. */
function demo(ctx: CanvasRenderingContext2D, lift: "bench" | "squat" | "deadlift", t: number, y: number) {
  const x = 40, w = 100, h = 8;
  ctx.fillStyle = INK;
  if (lift === "bench") {
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = TAUPE;
    ctx.fillRect(x + 52, y, 30, h);
    ctx.fillStyle = BLUE;
    ctx.fillRect(x + 63, y, 8, h);
    const pos = Math.abs(((t * 0.55) % (2 * w)) - w);
    const hit = Math.abs(pos - 67) < 5;
    ctx.fillStyle = INK;
    ctx.fillRect(x + pos - 2, y - 3, 5, h + 6);
    ctx.fillStyle = CREAM;
    ctx.fillRect(x + pos - 1, y - 2, 3, h + 4);
    if (hit) text(ctx, "TAP!", x + w + 12, y, 5, BLUE, "left");
  } else if (lift === "squat") {
    ctx.fillRect(x, y, w, h);
    const fill = (t % 220) / 220;
    ctx.fillStyle = CREAM;
    ctx.fillRect(x, y, w * fill, h);
    if (t % 24 < 12) text(ctx, "TAP TAP", x + w + 8, y, 5, BLUE, "left");
  } else {
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = TAUPE;
    ctx.fillRect(x + w * DEADLIFT.sweetMin, y, w * (DEADLIFT.sweetMax - DEADLIFT.sweetMin), h);
    ctx.fillStyle = BLUE;
    ctx.fillRect(x + w * (DEADLIFT_CENTRE - DEADLIFT.perfectHalfWidth), y, w * DEADLIFT.perfectHalfWidth * 2, h);
    const g = Math.min(1, (t % 260) / 200);
    ctx.fillStyle = CREAM;
    ctx.fillRect(x + w * g - 1, y - 2, 3, h + 4);
    text(ctx, g < DEADLIFT_CENTRE ? "HOLD" : "LET GO!", x + w + 8, y, 5, g < DEADLIFT_CENTRE ? CREAM : BLUE, "left");
  }
}

function drawIntro(ctx: CanvasRenderingContext2D, c: Circuit, character: Character) {
  if (c.phase.kind !== "intro") return;
  const p = c.phase;
  // The explainer sits above the lifter's head (no HUD during the intro), never over it.
  const top = FLOOR - poseHeight(character, "stance", liftScale) - 80;
  panel(ctx, 10, top, VIEW_W - 20, 74, 0.97);
  text(ctx, LIFT_NAMES[p.lift], VIEW_W / 2, top + 8, 10, BLUE);
  wrap(ctx, LIFT_TIPS[p.lift], VIEW_W / 2, top + 24, 150, 5);
  demo(ctx, p.lift, p.waited, top + 58);
  drawPose(ctx, character, "stance", VIEW_W / 2, FLOOR, { scale: liftScale });
  if (!p.ready) {
    if (Math.floor(p.waited / 45) % 2 === 0) tag(ctx, "TAP TO START", VIEW_W / 2, 264, 8, BLUE);
  } else {
    const secs = Math.ceil((p.ticksLeft / INTRO_TICKS) * 3);
    text(ctx, secs > 0 ? `${secs}` : "GO!", VIEW_W / 2, 262, 16, secs > 0 ? CREAM : BLUE);
  }
  if (p.npc) {
    // The "just eat whole foods bro" guy gets shut down before deadlifts, off to the sides.
    drawPose(ctx, "bro", p.ticksLeft % 60 < 30 ? "point" : "idle", 22, FLOOR, { scale: 1 });
    panel(ctx, 2, 144, 62, 30);
    wrap(ctx, WHOLE_FOODS_BRO, 33, 148, 56, 5, CREAM);
    miniLevi(ctx, 158, FLOOR);
    panel(ctx, 114, 144, 64, 38);
    wrap(ctx, LEVI_REPLY_WHOLE_FOODS, 146, 148, 58, 5, BLUE);
  }
}

export function drawFrame(ctx: CanvasRenderingContext2D, c: Circuit, character: Character) {
  // Lay the scene out on the 180×320 logical grid; sprites draw at native canvas pixels.
  // Tall phones get a taller canvas: the gym background covers it, the scene shifts down so its
  // floor lands on the background's floor (plus a little, to use the space), the lifter is drawn
  // a bit bigger, and the HUD stays pinned to the top.
  const h = Math.max(VIEW_H, ctx.canvas.height / PIXEL_RATIO);
  const extra = h - VIEW_H;
  const sceneY = Math.round(Math.min(extra, FLOOR * (h / VIEW_H - 1) + extra * 0.35));
  liftScale = SPRITE_SCALE * Math.min(1.2, 1 + extra / 350);
  ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
  ctx.imageSmoothingEnabled = false;
  background(ctx, h);
  const p = c.phase;
  // A GOAT rep shakes the screen for a moment.
  const st = p.kind === "lift" ? c.current?.state : undefined;
  const shakeAge = st?.outcome === "perfect" ? st.tick - st.outcomeTick : 99;
  const shake = shakeAge < 14 ? [2, -2, 1, -1, 1, 0, -1][shakeAge % 7] : 0;
  ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, shake * PIXEL_RATIO, (sceneY + (shake ? -shake : 0)) * PIXEL_RATIO);
  if (p.kind === "intro") return drawIntro(ctx, c, character);
  if (p.kind !== "lift" || !c.current) return;
  const s = c.current.state;
  if (p.lift === "bench") drawBench(ctx, s as BenchState, character);
  if (p.lift === "squat") drawSquat(ctx, s as SquatState, character);
  if (p.lift === "deadlift") drawDeadlift(ctx, s as DeadliftState, character);
  popup(ctx, s, character);
  ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
  const sq = s as SquatState;
  const bar = p.lift === "squat" && sq.repStart >= 0 && sq.cooldown === 0 ? 1 - (sq.tick - sq.repStart) / SQUAT.repTimeLimitTicks : null;
  hud(ctx, c, s, bar, LIFT_NAMES[p.lift]);
}
