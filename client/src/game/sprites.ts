/**
 * Code-drawn pixel sprite for the one non-playable cameo: the "just eat whole foods bro".
 * (The lifters themselves are image sprites — see poses.ts.)
 * Letters are palette keys; "." is transparent.
 */

const SPRITE_W = 20;
const SPRITE_H = 30;

export type SpriteId = "bro";

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

const PALETTES: Record<SpriteId, Record<string, string>> = {
  bro: {
    C: "#c0392b", h: "#3a2a20", S: "#e2b08c", s: "#c99472", E: "#2a1d14", M: "#9a5446", B: "#c99472",
    T: "#8a96a3", t: "#6c7682", L: "#8a96a3", P: "#2c3e66", p: "#1d2a47", O: "#f2f2f2", K: "#f2f2f2", k: "#999999",
  },
};

const cache = new Map<SpriteId, HTMLCanvasElement>();

function spriteCanvas(id: SpriteId): HTMLCanvasElement {
  const hit = cache.get(id);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = SPRITE_W;
  cv.height = SPRITE_H;
  const ctx = cv.getContext("2d")!;
  const pal = PALETTES[id];
  [...HEADS[id], ...BODY].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const colour = row[x] === "A" ? pal.S : pal[row[x]];
      if (!colour) continue;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  cache.set(id, cv);
  return cv;
}

/** Draw the cameo standing, top-left at (x, y) in logical px, `scale` logical px per sprite px. */
export function drawSprite(ctx: CanvasRenderingContext2D, id: SpriteId, x: number, y: number, scale: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spriteCanvas(id), x, y, SPRITE_W * scale, SPRITE_H * scale);
}
