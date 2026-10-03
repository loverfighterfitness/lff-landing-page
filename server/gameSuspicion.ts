import { YEAR_PRIZE_KG } from "@shared/game/config";
import type { InputEvent, RunLogs } from "@shared/game/types";

export { YEAR_PRIZE_KG };

const stats = (xs: number[]) => {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  return { mean, cv: mean ? sd / mean : 0 };
};

function holds(events: InputEvent[]): number[] {
  const out: number[] = [];
  for (let i = 0; i + 1 < events.length; i++) if (events[i].down && !events[i + 1].down) out.push(events[i + 1].tick - events[i].tick);
  return out;
}

/**
 * Reasons a run looks scripted rather than played by thumb. Humans are noisy: their tap holds vary
 * and even fast steady mashing drifts. These don't prove cheating; they mark runs to verify on video.
 */
export function suspicionFlags(logs: RunLogs, total: number): string[] {
  const flags: string[] = [];
  if (total >= YEAR_PRIZE_KG) flags.push(`${YEAR_PRIZE_KG}kg+ year-prize run: verify with a screen recording or live rerun`);

  const taps = [...holds(logs.bench), ...holds(logs.squat)];
  if (taps.length >= 30 && new Set(taps).size <= 2) flags.push(`robotic tap holds: ${taps.length} taps held for only ${new Set(taps).size} distinct lengths`);

  const downs = logs.squat.filter((e) => e.down).map((e) => e.tick);
  const gaps = downs.slice(1).map((t, i) => t - downs[i]).filter((g) => g < 40);
  if (gaps.length >= 40) {
    const { mean, cv } = stats(gaps);
    if (cv < 0.05) flags.push(`metronome squat mashing: ${gaps.length} taps, spacing varies only ${(cv * 100).toFixed(1)}%`);
    if (mean < 6.5) flags.push(`squat mashing at ${(100 / mean).toFixed(0)} taps/s sustained, faster than a thumb`);
  }
  return flags;
}
