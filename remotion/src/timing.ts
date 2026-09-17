/** Every beat of the graphic, in frames at 30fps. Tweak here, not in components. */
export const FPS = 30;
export const DURATION = 600; // 20s

export const BEATS = {
  title: { in: 0, out: 78 },
  axes: { in: 55 },
  legend: { in: 95 },
  growth: { in: 115, draw: 92 },
  fatigue: { in: 215, draw: 88 },
  sweetSpot: { in: 312 },
  crossover: { in: 402 },
  payoff: { in: 492 },
} as const;

export const CAPTIONS = [
  {
    in: 130,
    out: 214,
    kicker: "GROWTH STIMULUS",
    line: "PLATEAUS",
    sub: "past a point, extra sets stop adding signal",
  },
  {
    in: 224,
    out: 306,
    kicker: "FATIGUE",
    line: "DOESN'T",
    sub: "it keeps climbing in a straight line",
  },
  {
    in: 316,
    out: 398,
    kicker: "THE SWEET SPOT",
    line: "4–8 HARD SETS",
    sub: "almost all of the stimulus, a fraction of the cost",
  },
  {
    in: 408,
    out: 488,
    kicker: "PAST THE CROSSOVER",
    line: "JUNK VOLUME",
    sub: "you're buying fatigue, not growth",
  },
  {
    in: 498,
    out: DURATION,
    kicker: "AND AS YOU ADVANCE",
    line: "YOU NEED LESS",
    sub: "stronger lifters cost more fatigue per set",
  },
] as const;
