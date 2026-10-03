import { describe, expect, it } from "vitest";
import { suspicionFlags, YEAR_PRIZE_KG } from "./gameSuspicion";

const taps = (gaps: number[], hold: (i: number) => number) => {
  const out = [];
  let t = 0;
  for (let i = 0; i < gaps.length; i++) {
    out.push({ tick: t, down: true }, { tick: t + hold(i), down: false });
    t += gaps[i];
  }
  return out;
};
const noisy = (n: number, base: number, i0 = 7) => Array.from({ length: n }, (_, i) => base + ((i * i0) % 5) - 2);

describe("suspicionFlags", () => {
  it("leaves a normal human-looking run alone", () => {
    const logs = { bench: taps(noisy(20, 150), (i) => 4 + (i % 4)), squat: taps(noisy(80, 10), (i) => 3 + (i % 3)), deadlift: [] };
    expect(suspicionFlags(logs, 600)).toEqual([]);
  });

  it("flags year-prize scores for verification", () => {
    expect(suspicionFlags({ bench: [], squat: [], deadlift: [] }, YEAR_PRIZE_KG)[0]).toMatch(/verify/);
  });

  it("flags identical tap holds and metronome mashing", () => {
    const logs = { bench: taps(Array(20).fill(150), () => 2), squat: taps(Array(80).fill(5), () => 2), deadlift: [] };
    const flags = suspicionFlags(logs, 700).join(" | ");
    expect(flags).toMatch(/robotic tap holds/);
    expect(flags).toMatch(/metronome/);
    expect(flags).toMatch(/faster than a thumb/);
  });
});
