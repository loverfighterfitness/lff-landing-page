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
import { drawMiniLevi, drawSprite, SPRITE_H, SPRITE_W } from "./sprites";

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

function background(ctx: CanvasRenderingContext2D, character: Character) {
  ctx.fillStyle = BROWN;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Back wall bricks.
  ctx.fillStyle = "#4a3828";
  for (let y = 40; y < 200; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < VIEW_W; x += 16) ctx.fillRect(x, y, 14, 6);
  // Floor.
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 230, VIEW_W, VIEW_H - 230);
  ctx.fillStyle = "#3b2d20";
  for (let x = 0; x < VIEW_W; x += 20) ctx.fillRect(x, 230, 1, VIEW_H - 230);
  // Ruby gets a comp stage; Levi and Benny train under the bridge.
  if (character === "ruby") {
    ctx.fillStyle = "#7a5c3e";
    ctx.fillRect(10, 222, VIEW_W - 20, 8);
    text(ctx, "ICN", VIEW_W / 2, 46, 8, "#d4af37");
  } else {
    ctx.fillStyle = "#3b2d20";
    ctx.beginPath();
    ctx.arc(VIEW_W / 2, 200, 110, Math.PI, 0);
    ctx.lineTo(VIEW_W / 2 + 96, 200);
    ctx.arc(VIEW_W / 2, 200, 96, 0, Math.PI, true);
    ctx.fill();
  }
  text(ctx, "LFF", VIEW_W - 6, 6, 6, CREAM, "right");
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
  text(ctx, line, VIEW_W / 2, y, 8, colour);
  if (character === "benny" && s.outcome === "perfect" && s.outcomeTick % 3 === 0) {
    drawMiniLevi(ctx, 6, y + 14, 1);
    wrap(ctx, BENNY_BANTER_REPLY, 100, y + 16, 140, 5, CREAM);
  }
}

function drawBench(ctx: CanvasRenderingContext2D, s: BenchState, character: Character, gold: boolean) {
  const benchY = 196;
  ctx.fillStyle = "#6b4f36";
  ctx.fillRect(30, benchY + SPRITE_W * SCALE - 6, 120, 8);
  ctx.fillRect(40, benchY + SPRITE_W * SCALE, 6, 30);
  ctx.fillRect(134, benchY + SPRITE_W * SCALE, 6, 30);
  drawSprite(ctx, character, gold, 18, benchY, SCALE, { rotate: true });
  // LFF cuffs at the wrists.
  ctx.fillStyle = CREAM;
  ctx.fillRect(68, benchY - 4, 6, 3);
  // Bar travels down and up during a rep animation.
  const anim = s.cooldown > 0 && s.outcome !== "miss" ? Math.sin((s.cooldown / BENCH.cooldownTicks) * Math.PI) * 14 : 0;
  barbell(ctx, 72, benchY - 10 + anim, 150, s.kg);
  text(ctx, `${s.kg}KG`, 72, benchY - 34, 6, CREAM);
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
    if (s.kg === 130) wrap(ctx, BENNY_3_PLATES_LOADING, VIEW_W / 2, 120, 160, 6, "#d4af37");
    if (s.kg === 140 && s.outcome === "perfect" && s.tick - s.outcomeTick < 90) {
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = ["#d4af37", CREAM, LIME, RED][i % 4];
        ctx.fillRect((i * 37 + s.tick * 3) % VIEW_W, (i * 53 + s.tick * 2) % 220, 3, 3);
      }
      text(ctx, BENNY_3_PLATES_DONE, VIEW_W / 2, 120, 6, "#d4af37");
    }
  }
}

function drawSquat(ctx: CanvasRenderingContext2D, s: SquatState, character: Character, gold: boolean) {
  const x = VIEW_W / 2 - (SPRITE_W * SCALE) / 2;
  const y = 230 - SPRITE_H * SCALE;
  const squash = s.cooldown > 0 ? 0 : (1 - s.progress) * 7;
  drawSprite(ctx, character, gold, x, y, SCALE, { squash });
  barbell(ctx, VIEW_W / 2, y + 7 * SCALE + squash * SCALE, 150, 100);
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

function drawDeadlift(ctx: CanvasRenderingContext2D, s: DeadliftState, character: Character, gold: boolean) {
  const x = VIEW_W / 2 - (SPRITE_W * SCALE) / 2;
  const y = 230 - SPRITE_H * SCALE;
  const lockedOut = s.cooldown > 0;
  const lift = lockedOut ? 1 : s.gauge;
  drawSprite(ctx, character, gold, x, y, SCALE, { squash: (1 - lift) * 7 });
  const handY = y + 13 * SCALE + (1 - lift) * 7 * SCALE;
  // LFF straps glow at the hands.
  ctx.fillStyle = Math.floor(s.tick / 8) % 2 ? CREAM : "#fff8d8";
  ctx.fillRect(x + 1 * SCALE, handY - 2, 4, 4);
  ctx.fillRect(x + 14 * SCALE, handY - 2, 4, 4);
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

function drawIntro(ctx: CanvasRenderingContext2D, c: Circuit, character: Character, gold: boolean) {
  if (c.phase.kind !== "intro") return;
  const p = c.phase;
  text(ctx, LIFT_NAMES[p.lift], VIEW_W / 2, 70, 10, "#d4af37");
  wrap(ctx, LIFT_TIPS[p.lift], VIEW_W / 2, 92, 160, 6);
  drawSprite(ctx, character, gold, VIEW_W / 2 - (SPRITE_W * SCALE) / 2, 230 - SPRITE_H * SCALE, SCALE);
  const secs = Math.ceil((p.ticksLeft / INTRO_TICKS) * 3);
  text(ctx, secs > 0 ? `${secs}` : "GO!", VIEW_W / 2, 270, 16);
  if (p.npc) {
    // The "just eat whole foods bro" guy gets shut down before deadlifts.
    drawSprite(ctx, "benny", false, 8, 140, 1);
    wrap(ctx, WHOLE_FOODS_BRO, 70, 140, 100, 5, CREAM);
    drawMiniLevi(ctx, 8, 180, 1);
    wrap(ctx, LEVI_REPLY_WHOLE_FOODS, 70, 180, 100, 5, LIME);
  }
}

export function drawFrame(ctx: CanvasRenderingContext2D, c: Circuit, character: Character, gold: boolean) {
  ctx.imageSmoothingEnabled = false;
  background(ctx, character);
  const p = c.phase;
  if (p.kind === "intro") return drawIntro(ctx, c, character, gold);
  if (p.kind !== "lift" || !c.current) return;
  const s = c.current.state;
  if (p.lift === "bench") drawBench(ctx, s as BenchState, character, gold);
  if (p.lift === "squat") drawSquat(ctx, s as SquatState, character, gold);
  if (p.lift === "deadlift") drawDeadlift(ctx, s as DeadliftState, character, gold);
  hud(ctx, c, s, LIFT_SIMS[p.lift].maxTicks, LIFT_NAMES[p.lift]);
  popup(ctx, s, character);
}
