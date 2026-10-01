import type { BenchState } from "@shared/game/bench";
import { comboMultiplier } from "@shared/game/combo";
import { BENCH, DEADLIFT } from "@shared/game/config";
import { DEADLIFT_CENTRE, type DeadliftState } from "@shared/game/deadlift";
import type { LiftStateBase } from "@shared/game/lift";
import { LIFT_SIMS } from "@shared/game/run";
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
} from "./poses";

export { loadPoses } from "./poses";

export const VIEW_W = 180;
export const VIEW_H = 320;

const BROWN = "#54412F";
const DARK = "#2e2318";
const CREAM = "#EAE6D2";
const GREEN = "#5fbf4a";
const LIME = "#c8f560";
const RED = "#d9503f";
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
function background(ctx: CanvasRenderingContext2D) {
  if (!drawBackground(ctx)) {
    ctx.fillStyle = "#16120f";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  const top = ctx.createLinearGradient(0, 0, 0, 56);
  top.addColorStop(0, "rgba(0,0,0,0.75)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, VIEW_W, 56);
  const bottom = ctx.createLinearGradient(0, 244, 0, VIEW_H);
  bottom.addColorStop(0, "rgba(0,0,0,0)");
  bottom.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 244, VIEW_W, VIEW_H - 244);
}

/** A framed pixel panel for meters. */
function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "rgba(10,8,6,0.82)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(234,230,210,0.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function hud(ctx: CanvasRenderingContext2D, c: Circuit, s: LiftStateBase, maxTicks: number, lift: string) {
  text(ctx, lift, 6, 6, 8, CREAM, "left");
  const done = c.scores();
  const total = done.bench + done.squat + done.deadlift + s.score;
  text(ctx, `${s.score}`, 6, 18, 8, LIME, "left");
  text(ctx, `TOTAL ${total}`, VIEW_W - 6, 18, 6, CREAM, "right");
  if (s.combo > 0) text(ctx, `x${comboMultiplier(s.combo).toFixed(1)}`, VIEW_W - 6, 30, 8, "#d4af37", "right");
  // Time bar.
  ctx.fillStyle = DARK;
  ctx.fillRect(6, 30, 100, 4);
  ctx.fillStyle = CREAM;
  ctx.fillRect(6, 30, Math.max(0, 100 * (1 - s.tick / maxTicks)), 4);
}

/** Small pixel-Levi cameo (TUT trap, Benny banter, whole-foods bit). */
function miniLevi(ctx: CanvasRenderingContext2D, x: number, floorY: number, scale = 1) {
  drawPose(ctx, "levi", "stance", x, floorY, { scale });
}

function popup(ctx: CanvasRenderingContext2D, s: LiftStateBase, character: Character) {
  if (!s.outcome) return;
  const age = s.tick - s.outcomeTick;
  if (age > POPUP_TICKS) return;
  const y = 70 - Math.floor(age / 4);
  if (s.outcome === "tut") {
    miniLevi(ctx, 22, 124);
    wrap(ctx, TUT_LINE, 104, 74, 130, 6, CREAM);
    text(ctx, `-50`, VIEW_W / 2, y + 40, 8, RED);
    return;
  }
  const pool = s.outcome === "perfect" ? CHARACTER_INFO[character].perfectQuotes : POPUPS[s.outcome];
  const line = pool[s.outcomeTick % pool.length];
  const colour = s.outcome === "perfect" ? "#d4af37" : s.outcome === "good" ? LIME : RED;
  ctx.font = `8px ${FONT}`;
  if (ctx.measureText(line).width > 168) wrap(ctx, line, VIEW_W / 2, y, 168, 6, colour);
  else text(ctx, line, VIEW_W / 2, y, 8, colour);
  if (character === "benny" && s.outcome === "perfect" && s.outcomeTick % 3 === 0) {
    miniLevi(ctx, 14, y + 44, 0.5);
    wrap(ctx, BENNY_BANTER_REPLY, 100, y + 16, 140, 5, CREAM);
  }
}

const FLOOR = 236;

/** Pick one of three frames for a 0..1 movement (0 = start, 1 = end). */
function frame3<T>(t: number, a: T, b: T, c: T): T {
  return t < 0.34 ? a : t < 0.67 ? b : c;
}

function drawBench(ctx: CanvasRenderingContext2D, s: BenchState, character: Character) {
  // Side-on. During a rep the bar comes down to the chest and back up (1 = touching).
  const depth = s.cooldown > 0 && s.outcome !== "miss" ? Math.sin((s.cooldown / BENCH.cooldownTicks) * Math.PI) : 0;
  const pose = frame3(depth, "bench_up" as const, "bench_mid" as const, "bench_down" as const);
  const placed = drawPose(ctx, character, pose, 40, FLOOR, { anchor: "left" });
  drawPlateEndOn(ctx, placed, s.kg);
  text(ctx, `${s.kg}KG`, 64, FLOOR - poseHeight(character, "bench_up") - 16, 6, CREAM);
  // Timing meter.
  const mx = 20, my = 262, mw = 140, mh = 14;
  panel(ctx, mx - 4, my - 4, mw + 8, mh + 22);
  ctx.fillStyle = "#3a2e22";
  ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = GREEN;
  ctx.fillRect(mx + (s.zoneCenter - s.zoneWidth / 2) * mw, my, s.zoneWidth * mw, mh);
  const pw = s.zoneWidth * BENCH.perfectFraction;
  ctx.fillStyle = LIME;
  ctx.fillRect(mx + (s.zoneCenter - pw / 2) * mw, my, pw * mw, mh);
  ctx.fillStyle = CREAM;
  ctx.fillRect(mx + s.pos * mw - 1, my - 3, 3, mh + 6);
  for (let i = 0; i < BENCH.maxMisses; i++) {
    ctx.fillStyle = i < s.misses ? RED : "#5a4634";
    ctx.fillRect(mx + i * 10, my + mh + 4, 7, 4);
  }
  // Benny's 3-plate quest.
  if (character === "benny") {
    if (s.kg === 140) wrap(ctx, BENNY_3_PLATES_LOADING, VIEW_W / 2, 42, 160, 6, "#d4af37");
    if (s.kg === 150 && s.outcome === "perfect" && s.tick - s.outcomeTick < 90) {
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = ["#d4af37", CREAM, LIME, RED][i % 4];
        ctx.fillRect((i * 37 + s.tick * 3) % VIEW_W, (i * 53 + s.tick * 2) % 220, 3, 3);
      }
      text(ctx, BENNY_3_PLATES_DONE, VIEW_W / 2, 42, 6, "#d4af37");
    }
  }
}

function drawSquat(ctx: CanvasRenderingContext2D, s: SquatState, character: Character) {
  // progress 0 = bottom of the hole, 1 = standing; stand tall during the rep cooldown.
  const up = s.cooldown > 0 ? 1 : s.progress;
  const pose = frame3(up, "squat_bottom" as const, "squat_mid" as const, "squat_top" as const);
  const kg = Math.min(200, 60 + s.reps * 10);
  drawPlatesFront(ctx, drawPose(ctx, character, pose, VIEW_W / 2, FLOOR), kg);
  text(ctx, `${kg}KG`, VIEW_W / 2, 100, 8);
  // Drive meter (left) and form meter (right).
  const mh = 120, my = 104;
  panel(ctx, 5, my - 14, 16, mh + 18);
  panel(ctx, VIEW_W - 21, my - 14, 16, mh + 18);
  ctx.fillStyle = "#3a2e22";
  ctx.fillRect(9, my, 8, mh);
  ctx.fillRect(VIEW_W - 17, my, 8, mh);
  ctx.fillStyle = LIME;
  ctx.fillRect(9, my + mh * (1 - s.progress), 8, mh * s.progress);
  ctx.fillStyle = s.strain > 0.6 ? RED : s.strain > 0.3 ? "#e0a030" : GREEN;
  ctx.fillRect(VIEW_W - 17, my + mh * (1 - Math.min(1, s.strain)), 8, mh * Math.min(1, s.strain));
  text(ctx, "UP", 13, my - 10, 5);
  text(ctx, "FORM", VIEW_W - 13, my - 10, 4);
  text(ctx, `REPS ${s.reps}`, VIEW_W / 2, 272, 8);
}

function drawDeadlift(ctx: CanvasRenderingContext2D, s: DeadliftState, character: Character) {
  const lockedOut = s.cooldown > 0;
  const up = lockedOut ? 1 : s.pulling ? s.gauge / DEADLIFT.sweetMin : 0;
  const pose = frame3(up, "dl_bottom" as const, "dl_mid" as const, "dl_top" as const);
  // During lockout the bar shows the weight just lifted; otherwise what's loaded.
  const kg = lockedOut ? s.kg - DEADLIFT.kgStep : s.kg;
  drawPlatesFront(ctx, drawPose(ctx, character, pose, VIEW_W / 2 - 6, FLOOR), kg);
  text(ctx, lockedOut ? `NEXT ${s.kg}KG` : `${s.kg}KG`, VIEW_W / 2, 100, 8);
  // Power gauge.
  const gx = VIEW_W - 22, gy = 100, gh = 120;
  panel(ctx, gx - 4, gy - 4, 22, gh + 8);
  ctx.fillStyle = "#3a2e22";
  ctx.fillRect(gx, gy, 14, gh);
  ctx.fillStyle = GREEN;
  ctx.fillRect(gx + 1, gy + gh * (1 - DEADLIFT.sweetMax), 12, gh * (DEADLIFT.sweetMax - DEADLIFT.sweetMin));
  ctx.fillStyle = LIME;
  ctx.fillRect(gx + 1, gy + gh * (1 - DEADLIFT_CENTRE - DEADLIFT.perfectHalfWidth), 12, gh * DEADLIFT.perfectHalfWidth * 2);
  ctx.fillStyle = CREAM;
  ctx.fillRect(gx - 3, gy + gh * (1 - s.gauge) - 1, 20, 3);
  if (s.needRelease) text(ctx, "LET GO, RESET", VIEW_W / 2, 268, 6);
  else if (!s.pulling && !lockedOut) text(ctx, "HOLD TO PULL", VIEW_W / 2, 268, 6);
  text(ctx, `BEST ${s.bestKg}KG`, VIEW_W / 2, 284, 6);
}

function drawIntro(ctx: CanvasRenderingContext2D, c: Circuit, character: Character) {
  if (c.phase.kind !== "intro") return;
  const p = c.phase;
  panel(ctx, 10, 64, VIEW_W - 20, 54);
  text(ctx, LIFT_NAMES[p.lift], VIEW_W / 2, 72, 10, "#d4af37");
  wrap(ctx, LIFT_TIPS[p.lift], VIEW_W / 2, 88, 150, 5);
  drawPose(ctx, character, "stance", VIEW_W / 2, FLOOR);
  const secs = Math.ceil((p.ticksLeft / INTRO_TICKS) * 3);
  text(ctx, secs > 0 ? `${secs}` : "GO!", VIEW_W / 2, 262, 16, secs > 0 ? CREAM : "#d4af37");
  if (p.npc) {
    // The "just eat whole foods bro" guy gets shut down before deadlifts, off to the sides.
    drawPose(ctx, "bro", p.ticksLeft % 60 < 30 ? "point" : "idle", 22, FLOOR, { scale: 1 });
    panel(ctx, 2, 126, 62, 30);
    wrap(ctx, WHOLE_FOODS_BRO, 33, 130, 56, 5, CREAM);
    miniLevi(ctx, 158, FLOOR);
    panel(ctx, 114, 126, 64, 38);
    wrap(ctx, LEVI_REPLY_WHOLE_FOODS, 146, 130, 58, 5, LIME);
  }
}

export function drawFrame(ctx: CanvasRenderingContext2D, c: Circuit, character: Character) {
  // Lay the scene out on the 180×320 logical grid; sprites draw at native canvas pixels.
  ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
  ctx.imageSmoothingEnabled = false;
  background(ctx);
  const p = c.phase;
  if (p.kind === "intro") return drawIntro(ctx, c, character);
  if (p.kind !== "lift" || !c.current) return;
  const s = c.current.state;
  if (p.lift === "bench") drawBench(ctx, s as BenchState, character);
  if (p.lift === "squat") drawSquat(ctx, s as SquatState, character);
  if (p.lift === "deadlift") drawDeadlift(ctx, s as DeadliftState, character);
  hud(ctx, c, s, LIFT_SIMS[p.lift].maxTicks, LIFT_NAMES[p.lift]);
  popup(ctx, s, character);
}
