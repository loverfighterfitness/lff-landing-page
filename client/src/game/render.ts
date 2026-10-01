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
  BENCH_SHOULDER,
  drawBencher,
  drawBenchArms,
  drawMiniLevi,
  drawSprite,
  MAX_SQUASH,
  SPRITE_H,
  SPRITE_W,
} from "./sprites";

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

/** Their gym: dark ceiling with strip lights, red walls, black rubber floor with a red turf lane. */
function background(ctx: CanvasRenderingContext2D, character: Character) {
  // Ceiling + strip lights.
  ctx.fillStyle = "#16120f";
  ctx.fillRect(0, 0, VIEW_W, 56);
  for (const [lx, ly, lw] of [[14, 44, 28], [70, 40, 40], [134, 44, 28]] as const) {
    ctx.fillStyle = "#3a3a32";
    ctx.fillRect(lx - 1, ly - 1, lw + 2, 5);
    ctx.fillStyle = "#f4f1df";
    ctx.fillRect(lx, ly, lw, 3);
  }
  // Red wall with a darker skirting band.
  ctx.fillStyle = "#9e2a22";
  ctx.fillRect(0, 56, VIEW_W, 174);
  ctx.fillStyle = "#7d1f19";
  ctx.fillRect(0, 56, VIEW_W, 3);
  ctx.fillRect(0, 206, VIEW_W, 24);
  // Pixel LFF banner on the wall.
  ctx.fillStyle = "#54412F";
  ctx.fillRect(62, 64, 56, 22);
  text(ctx, "LFF", VIEW_W / 2, 71, 8, CREAM);
  if (character === "ruby") text(ctx, "ICN", VIEW_W / 2, 90, 6, "#d4af37");
  // Squat rack (left) and dumbbell rack (right), in black.
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(6, 100, 4, 130);
  ctx.fillRect(30, 100, 4, 130);
  ctx.fillRect(6, 100, 28, 3);
  ctx.fillRect(8, 150, 24, 2);
  ctx.fillRect(146, 176, 30, 3);
  ctx.fillRect(146, 198, 30, 3);
  ctx.fillRect(148, 176, 2, 54);
  ctx.fillRect(172, 176, 2, 54);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(149 + i * 7, 170, 5, 6);
    ctx.fillRect(149 + i * 7, 192, 5, 6);
  }
  // Rubber floor tiles + red turf lane with a white line.
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 230, VIEW_W, VIEW_H - 230);
  ctx.fillStyle = "#242424";
  for (let x = 0; x < VIEW_W; x += 30) ctx.fillRect(x, 230, 1, VIEW_H - 230);
  for (let y = 260; y < VIEW_H; y += 30) ctx.fillRect(0, y, VIEW_W, 1);
  ctx.fillStyle = "#a8302a";
  ctx.fillRect(0, 300, VIEW_W, 20);
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 300, VIEW_W, 1);
}

/** Barbell with plates per side. `kg` includes the 20 kg bar. */
function barbell(ctx: CanvasRenderingContext2D, cx: number, y: number, width: number, kg: number) {
  ctx.fillStyle = "#b8b8b8";
  ctx.fillRect(cx - width / 2, y, width, 2);
  const perSide = Math.max(0, (kg - 20) / 2);
  const big = Math.floor(perSide / 20);
  const small = perSide % 20 > 0 ? 1 : 0;
  for (const dir of [-1, 1]) {
    for (let i = 0; i < big; i++) {
      ctx.fillStyle = i % 2 ? "#8b1e1e" : "#a52a2a";
      ctx.fillRect(cx + dir * (width / 2 - 4 - i * 4) - (dir < 0 ? 0 : 3), y - 8, 3, 18);
    }
    if (small) {
      ctx.fillStyle = "#3a6ea5";
      ctx.fillRect(cx + dir * (width / 2 - 4 - big * 4) - (dir < 0 ? 0 : 3), y - 4, 3, 10);
    }
  }
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

function popup(ctx: CanvasRenderingContext2D, s: LiftStateBase, character: Character) {
  if (!s.outcome) return;
  const age = s.tick - s.outcomeTick;
  if (age > POPUP_TICKS) return;
  const y = 70 - Math.floor(age / 4);
  if (s.outcome === "tut") {
    drawMiniLevi(ctx, 8, 70, 2);
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
    drawMiniLevi(ctx, 6, y + 14, 1);
    wrap(ctx, BENNY_BANTER_REPLY, 100, y + 16, 140, 5, CREAM);
  }
}

/** The bar seen end-on (side view): the outer plate face, hub and collar. */
function plateEndOn(ctx: CanvasRenderingContext2D, cx: number, cy: number, kg: number) {
  const plates = Math.max(1, Math.floor((kg - 20) / 40));
  const r = Math.min(16, 9 + plates);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = plates >= 3 ? "#a52a2a" : "#2f5fa8";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c1c1c";
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c8c8c8";
  ctx.fillRect(cx - 2, cy - 2, 4, 4);
}

function drawBench(ctx: CanvasRenderingContext2D, s: BenchState, character: Character) {
  const scale = 4;
  const bx = 22;
  const by = 230 - 16 * scale;
  // Bench pad + legs under the lifter's back.
  ctx.fillStyle = "#111";
  ctx.fillRect(bx, by + 9 * scale, 21 * scale, 3 * scale);
  ctx.fillStyle = "#a8302a";
  ctx.fillRect(bx, by + 9 * scale, 21 * scale, 2 * scale);
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(bx + 2 * scale, by + 12 * scale, 2 * scale, 4 * scale);
  ctx.fillRect(bx + 17 * scale, by + 12 * scale, 2 * scale, 4 * scale);
  drawBencher(ctx, character, bx, by, scale);
  // Bar travels down to the chest and back up during a rep.
  const shoulderX = bx + BENCH_SHOULDER.x * scale;
  const shoulderY = by + BENCH_SHOULDER.y * scale;
  const anim = s.cooldown > 0 && s.outcome !== "miss" ? Math.sin((s.cooldown / BENCH.cooldownTicks) * Math.PI) : 0;
  const barY = Math.round(shoulderY - 44 + anim * 30);
  drawBenchArms(ctx, character, shoulderX, shoulderY, barY, scale);
  // LFF wrist cuffs.
  ctx.fillStyle = CREAM;
  ctx.fillRect(shoulderX - 1, barY + 4, 2 * scale + 2, 3);
  plateEndOn(ctx, shoulderX + scale, barY, s.kg);
  text(ctx, `${s.kg}KG`, shoulderX + scale, barY - 30, 6, CREAM);
  // Timing meter.
  const mx = 20, my = 270, mw = 140, mh = 14;
  ctx.fillStyle = DARK;
  ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
  ctx.fillStyle = "#5a4634";
  ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = GREEN;
  ctx.fillRect(mx + (s.zoneCenter - s.zoneWidth / 2) * mw, my, s.zoneWidth * mw, mh);
  const pw = s.zoneWidth * BENCH.perfectFraction;
  ctx.fillStyle = LIME;
  ctx.fillRect(mx + (s.zoneCenter - pw / 2) * mw, my, pw * mw, mh);
  ctx.fillStyle = CREAM;
  ctx.fillRect(mx + s.pos * mw - 1, my - 4, 3, mh + 8);
  for (let i = 0; i < BENCH.maxMisses; i++) {
    ctx.fillStyle = i < s.misses ? RED : "#5a4634";
    ctx.fillRect(mx + i * 10, my + 22, 7, 7);
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
  const x = VIEW_W / 2 - (SPRITE_W * SCALE) / 2;
  const y = 230 - SPRITE_H * SCALE;
  const squash = s.cooldown > 0 ? 0 : (1 - s.progress) * MAX_SQUASH;
  drawSprite(ctx, character, x, y, SCALE, { squash });
  barbell(ctx, VIEW_W / 2, y + 11 * SCALE + Math.round(squash) * SCALE, 150, 100);
  // Drive meter (left) and form meter (right).
  const mh = 120, my = 100;
  ctx.fillStyle = DARK;
  ctx.fillRect(8, my, 10, mh);
  ctx.fillRect(VIEW_W - 18, my, 10, mh);
  ctx.fillStyle = LIME;
  ctx.fillRect(9, my + mh * (1 - s.progress), 8, mh * s.progress);
  ctx.fillStyle = s.strain > 0.6 ? RED : s.strain > 0.3 ? "#e0a030" : GREEN;
  ctx.fillRect(VIEW_W - 17, my + mh * (1 - Math.min(1, s.strain)), 8, mh * Math.min(1, s.strain));
  text(ctx, "UP", 13, my - 10, 5);
  text(ctx, "FORM", VIEW_W - 13, my - 10, 5);
  text(ctx, `REPS ${s.reps}`, VIEW_W / 2, 270, 8);
}

function drawDeadlift(ctx: CanvasRenderingContext2D, s: DeadliftState, character: Character) {
  const x = VIEW_W / 2 - (SPRITE_W * SCALE) / 2;
  const y = 230 - SPRITE_H * SCALE;
  const lockedOut = s.cooldown > 0;
  const lift = lockedOut ? 1 : s.gauge;
  const squash = Math.round((1 - lift) * MAX_SQUASH);
  drawSprite(ctx, character, x, y, SCALE, { squash });
  const handY = y + 20 * SCALE + squash * SCALE;
  // LFF straps glow at the hands.
  ctx.fillStyle = Math.floor(s.tick / 8) % 2 ? CREAM : "#fff8d8";
  ctx.fillRect(x + 2 * SCALE, handY - 2, 6, 4);
  ctx.fillRect(x + 16 * SCALE, handY - 2, 6, 4);
  barbell(ctx, VIEW_W / 2, Math.min(handY, 222), 160, s.kg);
  text(ctx, `${s.kg}KG`, VIEW_W / 2, 90, 8);
  // Power gauge.
  const gx = VIEW_W - 22, gy = 100, gh = 120;
  ctx.fillStyle = DARK;
  ctx.fillRect(gx, gy, 14, gh);
  ctx.fillStyle = GREEN;
  ctx.fillRect(gx + 1, gy + gh * (1 - DEADLIFT.sweetMax), 12, gh * (DEADLIFT.sweetMax - DEADLIFT.sweetMin));
  ctx.fillStyle = LIME;
  ctx.fillRect(gx + 1, gy + gh * (1 - DEADLIFT_CENTRE - DEADLIFT.perfectHalfWidth), 12, gh * DEADLIFT.perfectHalfWidth * 2);
  ctx.fillStyle = CREAM;
  ctx.fillRect(gx - 3, gy + gh * (1 - s.gauge) - 1, 20, 3);
  if (s.needRelease) text(ctx, "LET GO, RESET", VIEW_W / 2, 270, 6);
  else if (!s.pulling && !lockedOut) text(ctx, "HOLD TO PULL", VIEW_W / 2, 270, 6);
  text(ctx, `BEST ${s.bestKg}KG`, VIEW_W / 2, 286, 6);
}

function drawIntro(ctx: CanvasRenderingContext2D, c: Circuit, character: Character) {
  if (c.phase.kind !== "intro") return;
  const p = c.phase;
  text(ctx, LIFT_NAMES[p.lift], VIEW_W / 2, 92, 10, "#d4af37");
  wrap(ctx, LIFT_TIPS[p.lift], VIEW_W / 2, 106, 150, 5);
  drawSprite(ctx, character, VIEW_W / 2 - (SPRITE_W * SCALE) / 2, 230 - SPRITE_H * SCALE, SCALE);
  const secs = Math.ceil((p.ticksLeft / INTRO_TICKS) * 3);
  text(ctx, secs > 0 ? `${secs}` : "GO!", VIEW_W / 2, 270, 16);
  if (p.npc) {
    // The "just eat whole foods bro" guy gets shut down before deadlifts.
    // Off to the sides so the lifter stays clear: bro on the left, Levi's reply on the right.
    drawSprite(ctx, "bro", 2, 170, 2);
    wrap(ctx, WHOLE_FOODS_BRO, 30, 134, 54, 5, CREAM);
    drawMiniLevi(ctx, 138, 170, 2);
    wrap(ctx, LEVI_REPLY_WHOLE_FOODS, 152, 134, 54, 5, LIME);
  }
}

export function drawFrame(ctx: CanvasRenderingContext2D, c: Circuit, character: Character) {
  ctx.imageSmoothingEnabled = false;
  background(ctx, character);
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
