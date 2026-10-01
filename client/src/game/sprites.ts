import type { Character } from "@shared/game/types";

export const SPRITE_W = 16;
export const SPRITE_H = 24;

/** Front-facing lifter. Letters are palette keys; "." is transparent. Each row is 16 wide. */
const BASE: string[] = [
  ".....HHHHHH.....",
  "....HHHHHHHH....",
  "....HSSSSSSH....",
  "....SSESSESS....",
  "....SSSSSSSS....",
  ".....SSSSSS.....",
  "......SSSS......",
  "...TTTTTTTTTT...",
  "..TTTTTTTTTTTT..",
  ".STTTTLLLLTTTTS.",
  ".STTTTLLLLTTTTS.",
  ".STTTTTTTTTTTTS.",
  ".S.TTTTTTTTTT.S.",
  ".S.TTTTTTTTTT.S.",
  "...PPPPPPPPPP...",
  "...PPPPPPPPPP...",
  "...PPPP..PPPP...",
  "....SSS..SSS....",
  "....SSS..SSS....",
  "....SSS..SSS....",
  "....SSS..SSS....",
  "....SSS..SSS....",
  "...KKKK..KKKK...",
  "...KKKK..KKKK...",
];

/** Per-character hair/face rows layered over BASE. */
const OVERRIDES: Record<Character, Record<number, string>> = {
  levi: {},
  ruby: {
    3: "...HSSESSESSH...",
    4: "...HSSSSSSSSH...",
    5: "...HHSSSSSSHH...",
    6: "...HH.SSSS.HH...",
  },
  benny: {
    0: "................",
    1: ".....SSSSSS.....",
    4: "....BSSSSSSB....",
    5: ".....BBBBBB.....",
  },
};

type Palette = Record<string, string>;

const PALETTES: Record<Character, Palette> = {
  levi: { H: "#2b1d14", S: "#d9a37c", E: "#1a1a1a", T: "#111111", L: "#EAE6D2", P: "#3a3a3a", K: "#EAE6D2", B: "#2b1d14" },
  ruby: { H: "#6b3a1f", S: "#e8b48f", E: "#1a1a1a", T: "#EAE6D2", L: "#54412F", P: "#54412F", K: "#ffffff", B: "#6b3a1f" },
  benny: { H: "#9a9a9a", S: "#c98d66", E: "#1a1a1a", T: "#54412F", L: "#EAE6D2", P: "#222222", K: "#333333", B: "#b8b8b8" },
};

export function paletteFor(c: Character, gold: boolean): Palette {
  return gold ? { ...PALETTES[c], T: "#d4af37", L: "#fff3b0" } : PALETTES[c];
}

function rows(c: Character): string[] {
  return BASE.map((r, i) => OVERRIDES[c][i] ?? r);
}

const cache = new Map<string, HTMLCanvasElement>();

/** The sprite at 1px per pixel, cached per character + skin. */
function spriteCanvas(c: Character, gold: boolean): HTMLCanvasElement {
  const key = `${c}:${gold}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = SPRITE_W;
  cv.height = SPRITE_H;
  const ctx = cv.getContext("2d")!;
  const pal = paletteFor(c, gold);
  rows(c).forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const colour = pal[row[x]];
      if (!colour) continue;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  cache.set(key, cv);
  return cv;
}

/**
 * Draw a lifter. `squash` (0..7 sprite px) bends the knees: the upper body drops while the feet stay planted.
 * `rotate` lays them on their back (head to the left) for the bench.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  c: Character,
  gold: boolean,
  x: number,
  y: number,
  scale: number,
  opts: { squash?: number; rotate?: boolean } = {},
) {
  ctx.imageSmoothingEnabled = false;
  const img = spriteCanvas(c, gold);
  if (opts.rotate) {
    ctx.save();
    ctx.translate(x, y + SPRITE_W * scale);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(img, 0, 0, SPRITE_W * scale, SPRITE_H * scale);
    ctx.restore();
    return;
  }
  let squash = Math.round(opts.squash ?? 0);
  squash = Math.max(0, Math.min(7, squash));
  const legsFrom = 17;
  ctx.drawImage(img, 0, 0, SPRITE_W, legsFrom, x, y + squash * scale, SPRITE_W * scale, legsFrom * scale);
  const legRows = SPRITE_H - legsFrom - squash;
  if (legRows > 0) {
    ctx.drawImage(
      img,
      0, SPRITE_H - legRows, SPRITE_W, legRows,
      x, y + (SPRITE_H - legRows) * scale, SPRITE_W * scale, legRows * scale,
    );
  }
}

/** Data URL for menus and the leaderboard. */
export function spriteDataUrl(c: Character, gold: boolean, scale: number): string {
  const cv = document.createElement("canvas");
  cv.width = SPRITE_W * scale;
  cv.height = SPRITE_H * scale;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  drawSprite(ctx, c, gold, 0, 0, scale);
  return cv.toDataURL();
}

/** Pixel-Levi cameo for the TUT trap and whole-foods bit. */
export function drawMiniLevi(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  drawSprite(ctx, "levi", false, x, y, scale);
}
