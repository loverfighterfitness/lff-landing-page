import type { Character, LiftScores } from "@shared/game/types";
import { CHARACTER_INFO, GAME_URL } from "./content";
import { poseUrl } from "./poses";
import { BLUE, BROWN, CREAM, INK, STONE } from "./theme";

const W = 1080;
const H = 1920;
const FONT = '"Press Start 2P", monospace';

function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, colour: string) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = INK;
  ctx.fillText(s, x + size / 6, y + size / 6);
  ctx.fillStyle = colour;
  ctx.fillText(s, x, y);
}

/** A 1080×1920 story card: gym, victory pose, score, rank, LFF branding and the game link. */
export async function renderScoreCard(opts: {
  character: Character;
  scores: LiftScores;
  total: number;
  rank: number | null;
  handle?: string;
}): Promise<Blob | null> {
  await document.fonts.load(`24px ${FONT}`).catch(() => undefined);
  const [bg, hero, wordmark, logo] = await Promise.all([
    load("/game/gym_bg.png"),
    load(poseUrl(opts.character, "victory")),
    load("/game/lover_fighter.png"),
    load("/game/lff_logo.png"),
  ]);
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  if (bg) ctx.drawImage(bg, 0, 0, W, (bg.height * W) / bg.width);
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, "rgba(42,31,21,0.75)");
  shade.addColorStop(0.55, "rgba(42,31,21,0.35)");
  shade.addColorStop(1, "rgba(20,14,9,0.95)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  // Header panel: logo + LOVER FIGHTER wordmark on brown, framed in cream.
  ctx.fillStyle = "rgba(84,65,47,0.95)";
  ctx.fillRect(80, 60, W - 160, 520);
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 8;
  ctx.strokeRect(92, 72, W - 184, 496);
  if (logo) ctx.drawImage(logo, W / 2 - 72, 100, 144, 144);
  if (wordmark) {
    const ww = 640;
    ctx.drawImage(wordmark, W / 2 - ww / 2, 270, ww, (wordmark.height * ww) / wordmark.width);
  }

  if (hero) {
    const hh = 690;
    const hw = (hero.width * hh) / hero.height;
    ctx.drawImage(hero, W / 2 - hw / 2, 630, hw, hh);
  }

  const info = CHARACTER_INFO[opts.character];
  label(ctx, `TEAM ${info.name}`, W / 2, 1350, 34, BLUE);
  label(ctx, `${opts.total}`, W / 2, 1410, 110, CREAM);
  if (opts.rank) label(ctx, `RANK #${opts.rank}`, W / 2, 1545, 40, STONE);
  const s = opts.scores;
  label(ctx, `BENCH ${s.bench} · SQUAT ${s.squat} · DL ${s.deadlift}`, W / 2, 1620, 24, STONE);

  // Call to action panel.
  ctx.fillStyle = BROWN;
  ctx.fillRect(80, 1690, W - 160, 150);
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 6;
  ctx.strokeRect(92, 1702, W - 184, 126);
  label(ctx, "THINK YOU CAN BEAT ME?", W / 2, 1725, 30, CREAM);
  label(ctx, GAME_URL.toUpperCase(), W / 2, 1775, 26, BLUE);

  return new Promise((resolve) => cv.toBlob((b) => resolve(b), "image/png"));
}

/** Share the card through the phone's share sheet, or download it on desktop. */
export async function shareScoreCard(blob: Blob, character: Character): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], `lff-lover-fighter-${character}.png`, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: `Beat my score on LFF Lover Fighter: ${GAME_URL}` });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}
