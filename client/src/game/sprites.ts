import type { Character } from "@shared/game/types";

/**
 * Pixel art for the lifters, drawn from their photos:
 * Levi — light-brown swept hair, black LFF tee. Ruby — long dark hair in a ponytail, cream tee,
 * black bike shorts, white socks + sneakers. Benny — bleached-blonde crop with faded sides,
 * dark stubble, tattoo sleeves, brown tee. Every tee carries the pixel "lff" mark on the left chest.
 * Letters are palette keys; "." is transparent.
 */

export const SPRITE_W = 20;
export const SPRITE_H = 30;
/** Shorts start here; shins start at SHINS_FROM and stay planted when the knees bend. */
const SHORTS_FROM = 22;
const SHINS_FROM = 25;
export const MAX_SQUASH = 4;

/** Non-playable cameo: the "just eat whole foods bro" guy. */
export type SpriteId = Character | "bro";

const BODY: string[] = [
  "........sSSs........",
  "....TTTTTTTTTTTT....",
  "...TTTTTTTTTTTTTT...",
  "..TTTTTTTTTTTLTLLT..",
  "..tTTTTTTTTTLTLLTt..",
  "..tTTTTTTTTTLTLTTt..",
  "..AtTTTTTTTLTLTTtA..",
  "..AATTTTTTTTTTTTAA..",
  "..AATTTTTTTTTTTTAA..",
  "..SATTTTTTTTTTTTAS..",
  "..SStTTTTTTTTTTtSS..",
  "....tttttttttttt....",
  "....PPPPPPPPPPPP....",
  "....PPPPPp.pPPPP....",
  "....PPPPp...pPPP....",
  ".....SSS....SSS.....",
  ".....SSS....SSS.....",
  ".....OOO....OOO.....",
  "....KKKK....KKKK....",
  "....kkkk....kkkk....",
];

const HEADS: Record<SpriteId, string[]> = {
  levi: [
    "......hHHHHHh.......",
    ".....HHHhHHHHH......",
    ".....HHHHHHHHHh.....",
    ".....hSSSSSSSSh.....",
    ".....SSESSSSESS.....",
    ".....SSSSSSSSSS.....",
    ".....sSSSSSSSSs.....",
    "......SSSMMSSS......",
    ".......SSSSSS.......",
    "........SSSS........",
  ],
  ruby: [
    "......hHHHHHh.......",
    ".....HHHHHHHHH......",
    "....HHHhHHHHHHH.....",
    "....HHSSSSSSSHH.....",
    "....HSSESSSSESH.....",
    "....HSSSSSSSSSHH....",
    "....HsSSSSSSSsHH....",
    ".....SSSSMMSSS.HH...",
    ".......SSSSSS...H...",
    "........SSSS....H...",
  ],
  benny: [
    "......HHHHHHH.......",
    ".....HHHHHHHHH......",
    ".....hHHHHHHHh......",
    ".....hSSSSSSSh......",
    ".....SSESSSSESS.....",
    ".....SSSSSSSSSS.....",
    ".....sSSSSSSSSs.....",
    "......BBSMMSBB......",
    ".......BBBBBB.......",
    "........SSSS........",
  ],
  bro: [
    ".....CCCCCCCC.......",
    "....CCCCCCCCCCCC....",
    ".....hSSSSSSSSh.....",
    ".....SSSSSSSSSS.....",
    ".....SSESSSSESS.....",
    ".....SSSSSSSSSS.....",
    ".....sSSSSSSSSs.....",
    "......SSSMMSSS......",
    ".......SSSSSS.......",
    "........SSSS........",
  ],
};

/**
 * Lying on the bench, side-on, head to the left, knees up, feet on the floor.
 * Arms and the bar are drawn by the renderer (they move with each rep).
 */
export const BENCH_W = 32;
export const BENCH_H = 16;
/** Where the arms start, in bench-sprite pixels. */
export const BENCH_SHOULDER = { x: 9, y: 4 };

const BENCH_BODY: string[] = [
  "................................",
  ".....................PPP........",
  "...................PPPPPS.......",
  "..HHHHH..........PPPPP.SS.......",
  ".HHHHHHH......TTPPPP....SS......",
  ".HHSSSSSTTTTTTTTPPP.....SS......",
  ".HSSESSSTTTTLTLTTPP......SS.....",
  ".HSSSSSSTTTTTTTTTPP......SS.....",
  "..SSSSS.tttttttttPP......SS.....",
  "........................SS......",
  "........................SS......",
  "........................SS......",
  "........................OO......",
  "........................OO......",
  ".......................KKKK.....",
  "......................kkkkk.....",
];

const BENCH_HEAD_OVERRIDES: Record<Character, Record<number, string>> = {
  levi: {},
  ruby: {
    8: ".HSSSSS.tttttttttPP......SS.....",
    9: "HH......................SS......",
    10: "H.......................SS......",
  },
  benny: {
    7: ".hSSSSSSTTTTTTTTTPP......SS.....",
    8: "..BBBBB.tttttttttPP......SS.....",
  },
};

type Palette = Record<string, string>;

const INK = "#2a2f36";

const PALETTES: Record<SpriteId, Palette> = {
  levi: {
    H: "#9a7348", h: "#6e5032", S: "#efc6a6", s: "#d9a888", E: "#2a1d14", M: "#b56d5e", B: "#d9a888",
    T: "#141414", t: "#000000", L: "#EAE6D2", P: "#1f1f1f", p: "#0d0d0d", O: "#f2f2f2", K: "#1f1f1f", k: "#EAE6D2",
  },
  ruby: {
    H: "#2e1f18", h: "#1a110c", S: "#f1cfb4", s: "#dcb293", E: "#2a1d14", M: "#c27a72", B: "#dcb293",
    T: "#EAE6D2", t: "#cfc8ae", L: "#54412F", P: "#151515", p: "#000000", O: "#ffffff", K: "#f5f5f5", k: "#bdbdbd",
  },
  benny: {
    H: "#f1e3b0", h: "#8a7a5a", S: "#d79c72", s: "#bb7f58", E: "#2a1d14", M: "#9a5446", B: "#5e5048",
    T: "#54412F", t: "#3f3022", L: "#EAE6D2", P: "#151515", p: "#000000", O: "#151515", K: "#2a2a2a", k: "#111111",
  },
  bro: {
    C: "#c0392b", h: "#3a2a20", S: "#e2b08c", s: "#c99472", E: "#2a1d14", M: "#9a5446", B: "#c99472",
    T: "#8a96a3", t: "#6c7682", L: "#8a96a3", P: "#2c3e66", p: "#1d2a47", O: "#f2f2f2", K: "#f2f2f2", k: "#999999",
  },
};

/** Skin on the arms — Benny's are full tattoo sleeves. */
function armColour(id: SpriteId, x: number, y: number): string {
  const p = PALETTES[id];
  return id === "benny" && (x + y) % 2 === 0 ? INK : p.S;
}

function paint(ctx: CanvasRenderingContext2D, id: SpriteId, rows: string[], isArm: (ch: string, x: number, y: number) => boolean) {
  const pal = PALETTES[id];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      const colour = isArm(ch, x, y) ? armColour(id, x, y) : pal[ch];
      if (!colour) continue;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, 1, 1);
    }
  });
}

const cache = new Map<string, HTMLCanvasElement>();

function cached(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  cache.set(key, cv);
  return cv;
}

function frontCanvas(id: SpriteId): HTMLCanvasElement {
  return cached(`front:${id}`, SPRITE_W, SPRITE_H, (ctx) =>
    paint(ctx, id, [...HEADS[id], ...BODY], (ch, x, y) => ch === "A" || (ch === "S" && y >= 16 && (x <= 3 || x >= 16))),
  );
}

function benchCanvas(c: Character): HTMLCanvasElement {
  const rows = BENCH_BODY.map((r, i) => BENCH_HEAD_OVERRIDES[c][i] ?? r);
  return cached(`bench:${c}`, BENCH_W, BENCH_H, (ctx) => paint(ctx, c, rows, () => false));
}

/**
 * Draw a standing lifter. `squash` (0..MAX_SQUASH sprite px) bends the knees: the upper body
 * drops, the thighs (shorts) splay out wider, and the feet stay planted.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  id: SpriteId,
  x: number,
  y: number,
  scale: number,
  opts: { squash?: number } = {},
) {
  ctx.imageSmoothingEnabled = false;
  const img = frontCanvas(id);
  const squash = Math.max(0, Math.min(MAX_SQUASH, Math.round(opts.squash ?? 0)));
  // Planted shins and feet (the top `squash` shin rows disappear behind the thighs).
  const shinRows = SPRITE_H - SHINS_FROM - squash;
  ctx.drawImage(
    img,
    0, SPRITE_H - shinRows, SPRITE_W, shinRows,
    x, y + (SPRITE_H - shinRows) * scale, SPRITE_W * scale, shinRows * scale,
  );
  // Thighs: the shorts rows, widened by one pixel each side per step of depth.
  const spread = squash;
  const shortsRows = SHINS_FROM - SHORTS_FROM;
  ctx.drawImage(
    img,
    0, SHORTS_FROM, SPRITE_W, shortsRows,
    x - spread * scale, y + (SHORTS_FROM + squash) * scale, (SPRITE_W + 2 * spread) * scale, shortsRows * scale,
  );
  // Upper body.
  ctx.drawImage(img, 0, 0, SPRITE_W, SHORTS_FROM, x, y + squash * scale, SPRITE_W * scale, SHORTS_FROM * scale);
}

/** Draw a lifter lying on the bench, side-on (no arms — see drawBenchArms). */
export function drawBencher(ctx: CanvasRenderingContext2D, c: Character, x: number, y: number, scale: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(benchCanvas(c), x, y, BENCH_W * scale, BENCH_H * scale);
}

/** Vertical arms from the shoulder up to the bar: tee sleeve, then skin (or Benny's ink). */
export function drawBenchArms(ctx: CanvasRenderingContext2D, c: Character, shoulderX: number, shoulderY: number, barY: number, scale: number) {
  const pal = PALETTES[c];
  const w = 2 * scale;
  const sleeve = 3 * scale;
  ctx.fillStyle = pal.T;
  ctx.fillRect(shoulderX, shoulderY - sleeve, w, sleeve);
  for (let yy = barY; yy < shoulderY - sleeve; yy += scale) {
    for (let col = 0; col < 2; col++) {
      ctx.fillStyle = armColour(c, col, Math.floor(yy / scale));
      ctx.fillRect(shoulderX + col * scale, yy, scale, Math.min(scale, shoulderY - sleeve - yy));
    }
  }
}

/** Data URL for menus and the leaderboard. */
export function spriteDataUrl(c: Character, scale: number): string {
  const cv = document.createElement("canvas");
  cv.width = SPRITE_W * scale;
  cv.height = SPRITE_H * scale;
  const ctx = cv.getContext("2d")!;
  drawSprite(ctx, c, 0, 0, scale);
  return cv.toDataURL();
}

/** Pixel-Levi cameo for the TUT trap and whole-foods bit. */
export function drawMiniLevi(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  drawSprite(ctx, "levi", x, y, scale);
}
