import type { Character } from "@shared/game/types";
import { gameAsset } from "./theme";

/**
 * 16-bit sprites, generated from photos of Levi, Ruby and Benny and pixelated to a shared palette.
 * Files: /public/game/sprites/<id>_<pose>.png, plus <id>.json with each pose's size and where the
 * barbell sits (so plates can be drawn to match the weight on the bar). Each image's bottom edge is
 * the floor.
 */
export const POSES = [
  "idle", "stance", "flex", "victory", "point",
  "squat_top", "squat_mid", "squat_bottom",
  "dl_bottom", "dl_mid", "dl_top",
  "bench_up", "bench_mid", "bench_down",
] as const;
export type Pose = (typeof POSES)[number];
export type SpriteId = Character | "bro";

/** Which poses exist on disk for each sprite set. Missing poses fall back (see FALLBACK). */
const AVAILABLE: Record<SpriteId, readonly Pose[]> = {
  levi: ["stance", "flex", "victory", "squat_top", "squat_mid", "squat_bottom", "dl_bottom", "dl_mid", "dl_top", "bench_up", "bench_mid", "bench_down"],
  ruby: ["stance", "flex", "victory", "squat_top", "squat_mid", "squat_bottom", "dl_bottom", "dl_mid", "dl_top", "bench_up", "bench_mid", "bench_down"],
  benny: ["stance", "flex", "victory", "squat_top", "squat_mid", "squat_bottom", "dl_bottom", "dl_mid", "dl_top", "bench_up", "bench_mid", "bench_down"],
  bro: ["idle", "point"],
};

const FALLBACK: Partial<Record<Pose, Pose>> = {
  stance: "idle", idle: "stance", flex: "stance", victory: "flex", point: "idle",
  squat_mid: "squat_top", dl_mid: "dl_bottom", bench_mid: "bench_down",
};

/** The pose that will actually be drawn for `id` (walks the fallback chain). */
export function resolvePose(id: SpriteId, pose: Pose): Pose {
  let p: Pose | undefined = pose;
  for (let i = 0; i < 4 && p; i++) {
    if (AVAILABLE[id].includes(p)) return p;
    p = FALLBACK[p];
  }
  return AVAILABLE[id][0];
}

export function poseUrl(id: SpriteId, pose: Pose): string {
  return gameAsset(`sprites/${id}_${resolvePose(id, pose)}.png`);
}

/** Canvas pixels per logical pixel (the scene is laid out on a 180×320 grid). */
export const PIXEL_RATIO = 3;
/** Sprite pixels are drawn 2×2 on the canvas. */
const SPRITE_SCALE = 2;

type PoseMeta = { w: number; h: number; bar?: { y: number; x0: number; x1: number }; barEnd?: { x: number; y: number } };

const images = new Map<string, HTMLImageElement>();
const meta = new Map<SpriteId, Record<string, PoseMeta>>();
let loading: Promise<void> | null = null;

/** Load every sprite and its metadata once. Resolves even if some fail (missing art is skipped). */
export function loadPoses(): Promise<void> {
  if (loading) return loading;
  const jobs: Promise<unknown>[] = [];
  for (const id of Object.keys(AVAILABLE) as SpriteId[]) {
    for (const pose of AVAILABLE[id]) {
      const img = new Image();
      images.set(`${id}:${pose}`, img);
      jobs.push(new Promise((resolve) => {
        img.onload = img.onerror = () => resolve(undefined);
        img.src = gameAsset(`sprites/${id}_${pose}.png`);
      }));
    }
    jobs.push(
      fetch(gameAsset(`sprites/${id}.json`))
        .then((r) => (r.ok ? r.json() : {}))
        .then((m) => meta.set(id, m))
        .catch(() => meta.set(id, {})),
    );
  }
  const mark = new Image();
  images.set("mark", mark);
  jobs.push(new Promise((resolve) => {
    mark.onload = mark.onerror = () => resolve(undefined);
    mark.src = gameAsset("lff_mark.png");
  }));
  const bg = new Image();
  images.set("bg", bg);
  jobs.push(new Promise((resolve) => {
    bg.onload = bg.onerror = () => resolve(undefined);
    bg.src = gameAsset("gym_bg.png");
  }));
  loading = Promise.all(jobs).then(() => undefined);
  return loading;
}

/** The pixel-art gym, drawn to fill the canvas. Returns false if it hasn't loaded. */
export function drawBackground(ctx: CanvasRenderingContext2D): boolean {
  const bg = images.get("bg");
  if (!bg?.naturalWidth) return false;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bg, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  return true;
}

/** Where a pose landed on the canvas, for drawing plates on its bar. */
export type Placed = { px: number; py: number; s: number; meta?: PoseMeta };

/**
 * Draw a pose with its bottom edge on `floorY` (logical px).
 * `anchor` "center" centres it on `x`; "left" puts its left edge at `x` (bench poses, so the head
 * stays put between frames).
 */
export function drawPose(
  ctx: CanvasRenderingContext2D,
  id: SpriteId,
  pose: Pose,
  x: number,
  floorY: number,
  opts: { anchor?: "center" | "left"; scale?: number; flip?: boolean } = {},
): Placed | null {
  const real = resolvePose(id, pose);
  const img = images.get(`${id}:${real}`);
  if (!img?.naturalWidth) return null;
  const s = opts.scale ?? SPRITE_SCALE;
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  const px = Math.round(x * PIXEL_RATIO - (opts.anchor === "left" ? 0 : w / 2));
  const py = Math.round(floorY * PIXEL_RATIO - h);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (opts.flip) {
    ctx.translate(px + w, py);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
  } else {
    ctx.drawImage(img, px, py, w, h);
  }
  ctx.restore();
  return { px, py, s, meta: meta.get(id)?.[real] };
}

/** Height of a pose in logical px (for placing text above it). */
export function poseHeight(id: SpriteId, pose: Pose, scale = SPRITE_SCALE): number {
  const img = images.get(`${id}:${resolvePose(id, pose)}`);
  return img?.naturalHeight ? (img.naturalHeight * scale) / PIXEL_RATIO : 0;
}

/**
 * LFF black bumper plates per side, heaviest first: kg, height and thickness (sprite px).
 * Weight reads from size and count; the cream band is the LFF stripe.
 */
const PLATES = [
  { kg: 25, h: 42, t: 6 },
  { kg: 20, h: 42, t: 5 },
  { kg: 15, h: 36, t: 5 },
  { kg: 10, h: 30, t: 4 },
  { kg: 5, h: 22, t: 3 },
  { kg: 2.5, h: 16, t: 2 },
] as const;
/** Stone plates with a brown LFF band: on-brand and readable against the dark gym. */
const PLATE_BODY = "#D4CEBA";
const PLATE_BAND = "#54412F";

/** Plates for one side of a bar loaded to `kg` (20 kg bar). */
export function platesFor(kg: number) {
  let left = Math.max(0, (kg - 20) / 2);
  const out: (typeof PLATES)[number][] = [];
  for (const p of PLATES) {
    while (left >= p.kg - 1e-9) {
      out.push(p);
      left -= p.kg;
    }
  }
  return out;
}

/**
 * Draw plates on both ends of a front-view bar, matching `kg`. Skipped for art that has plates
 * drawn in (no bar metadata).
 */
export function drawPlatesFront(ctx: CanvasRenderingContext2D, placed: Placed | null, kg: number) {
  const bar = placed?.meta?.bar;
  if (!placed || !bar) return;
  const { px, py, s } = placed;
  const plates = platesFor(kg);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const side of [-1, 1] as const) {
    // Plates load from the collar (about a quarter in from each end) outwards to the sleeve end.
    const sleeve = Math.round((bar.x1 - bar.x0) * 0.24);
    let x = side < 0 ? bar.x0 + sleeve : bar.x1 - sleeve;
    for (const p of plates) {
      const left = side < 0 ? x - p.t : x;
      ctx.fillStyle = "#2A1F15";
      ctx.fillRect(px + (left - 0.5) * s, py + (bar.y - p.h / 2 - 0.5) * s, (p.t + 1) * s, (p.h + 1) * s);
      ctx.fillStyle = PLATE_BODY;
      ctx.fillRect(px + left * s, py + (bar.y - p.h / 2) * s, p.t * s, p.h * s);
      // Cream LFF band across the big plates, cream edge on the small ones.
      ctx.fillStyle = PLATE_BAND;
      if (p.kg >= 15) ctx.fillRect(px + left * s, py + (bar.y - 4) * s, p.t * s, 2 * s);
      else ctx.fillRect(px + left * s, py + (bar.y - p.h / 2) * s, p.t * s, s);
      x = side < 0 ? x - p.t - 0.5 : x + p.t + 0.5;
    }
  }
  ctx.restore();
}

/** Bench is side-on, so the bar is seen end-on: draw the outer plate face with rings for the stack. */
export function drawPlateEndOn(ctx: CanvasRenderingContext2D, placed: Placed | null, kg: number) {
  const end = placed?.meta?.barEnd;
  if (!placed || !end) return;
  const plates = platesFor(kg);
  if (!plates.length) return;
  const { px, py, s } = placed;
  const cx = px + end.x * s;
  const cy = py + end.y * s;
  const outer = plates[0];
  const r = (outer.h / 2) * s;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const disc = (radius: number, colour: string) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  };
  // Bench plate face: brown with a cream rim and the cream lff mark.
  disc(r + s, "#2A1F15");
  disc(r, "#54412F");
  // Cream rim, plus a faint ring per extra plate so heavier bars look heavier.
  ctx.lineWidth = s;
  ctx.strokeStyle = "#EAE6D2";
  ctx.beginPath();
  ctx.arc(cx, cy, r - s, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 1; i < Math.min(plates.length, 5); i++) {
    ctx.strokeStyle = "rgba(234,230,210,0.18)";
    ctx.beginPath();
    ctx.arc(cx, cy, r - (i * 2 + 1) * s, 0, Math.PI * 2);
    ctx.stroke();
  }
  // The lff mark on the plate face.
  const mark = images.get("mark");
  if (mark?.naturalWidth) {
    ctx.imageSmoothingEnabled = false;
    const mw = mark.naturalWidth * s;
    ctx.drawImage(mark, cx - mw / 2, cy - r * 0.62 - mw / 2, mw, mark.naturalHeight * s);
  }
  disc(3 * s, "#2a2a2a");
  disc(1.5 * s, "#c8c8c8");
  ctx.restore();
}
