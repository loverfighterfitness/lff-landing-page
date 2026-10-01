import { CHARACTERS, type Character } from "@shared/game/types";

/**
 * 16-bit lifter sprites, generated from photos of Levi, Ruby and Benny and pixelated to a shared
 * palette. Files live in /public/game/sprites/<character>_<pose>.png; each image's bottom edge is
 * the floor (feet, or bench legs for the bench poses).
 */
export const POSES = ["idle", "squat_top", "squat_bottom", "dl_bottom", "dl_top", "bench_up", "bench_down"] as const;
export type Pose = (typeof POSES)[number];

/** Canvas pixels per logical pixel (the scene is laid out on a 180×320 grid). */
export const PIXEL_RATIO = 3;
/** Sprite pixels are drawn 2×2 on the canvas, i.e. 2/3 of a logical pixel. */
const SPRITE_SCALE = 2;

export function poseUrl(c: Character, pose: Pose): string {
  return `/game/sprites/${c}_${pose}.png`;
}

const images = new Map<string, HTMLImageElement>();

/** Load every sprite once. Resolves even if some fail (the scene just skips a missing image). */
export function loadPoses(): Promise<void> {
  const jobs: Promise<void>[] = [];
  for (const c of CHARACTERS) {
    for (const pose of POSES) {
      const key = `${c}:${pose}`;
      if (images.has(key)) continue;
      const img = new Image();
      images.set(key, img);
      jobs.push(
        new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = poseUrl(c, pose);
        }),
      );
    }
  }
  return Promise.all(jobs).then(() => undefined);
}

/**
 * Draw a pose with its bottom edge on `floorY` (logical px).
 * `anchor` "center" centres it on `x`; "left" puts its left edge at `x` (bench poses, so the head
 * doesn't jump between the arms-up and arms-down frames).
 */
export function drawPose(
  ctx: CanvasRenderingContext2D,
  c: Character,
  pose: Pose,
  x: number,
  floorY: number,
  opts: { anchor?: "center" | "left"; scale?: number } = {},
) {
  const img = images.get(`${c}:${pose}`);
  if (!img || !img.complete || !img.naturalWidth) return;
  const s = opts.scale ?? SPRITE_SCALE;
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  const px = Math.round(x * PIXEL_RATIO - (opts.anchor === "left" ? 0 : w / 2));
  const py = Math.round(floorY * PIXEL_RATIO - h);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, px, py, w, h);
  ctx.restore();
}

/** Height of a pose in logical px (for placing text above it). */
export function poseHeight(c: Character, pose: Pose, scale = SPRITE_SCALE): number {
  const img = images.get(`${c}:${pose}`);
  return img?.naturalHeight ? (img.naturalHeight * scale) / PIXEL_RATIO : 0;
}
