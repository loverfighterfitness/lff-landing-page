# LFF Gym (8-bit Workout Game) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a lazy-loaded `/game` page with a 3-lift 8-bit gym circuit (bench → squat → deadlift), a live leaderboard with server-verified scores, and an admin tab to run a two-week tee giveaway.

**Architecture:** Each lift is a deterministic, fixed-tick (10 ms) state machine in `shared/game/`. The client runs the lifts live and records only the input changes (press/release + tick). The server replays that input log with the *same* shared code and a server-issued seed, so the score can't be faked — only earned. React renders menus/forms/leaderboard; a single `<canvas>` (180×320, integer-scaled, pixelated) renders the lifts.

**Tech Stack:** React 19 + Vite + wouter + Tailwind (client), Express + tRPC 11 + zod 4 + superjson (server), Drizzle ORM 0.44 on MySQL, vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-01-lff-gym-game-design.md`

## Global Constraints

- **Do not modify** shop, Stripe, checkout, or SMS code (`server/routers/shop.ts`, `server/routers/stripe.ts`, `client/src/pages/Shop.tsx`, `server/smsScheduler.ts`, etc.).
- Characters are cosmetic only — identical gameplay. IDs: `levi` (black tee), `ruby` (cream tee), `benny` (brown tee).
- All tuning numbers live in `shared/game/config.ts`.
- Score is only ever computed by replaying the input log with shared code; never trust a client-sent score.
- Public endpoints never return emails.
- Copy follows Levi's voice (`/Users/levihurst/AI context/brand-voice.md`): confident, science-literate, never bro — *except* Benny, who is the deliberate old-school gym-bro (Ronnie Coleman quotes).
- Palette: brown `#54412F`, cream `#EAE6D2`. Pixel font: Google Fonts "Press Start 2P", loaded only on `/game`.
- `.env` holds the **production** `DATABASE_URL`. Never run migrations, `pnpm db:push`, or a DB-connected dev server without Levi's explicit go-ahead. Local verification runs with `DATABASE_URL=` (empty).
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Work on branch `feature/lff-gym-game`.
- Run commands from the repo root: `/Users/levihurst/AI context/LFF LANDING PAGE/lff-landing-page`. pnpm lives at `/Users/levihurst/Library/pnpm/pnpm` if `pnpm` isn't on PATH.

## Spec deltas (decided while planning — spec updated to match)

- Combo multiplier resets at the start of each lift (simpler, same feel).
- Deadlift scores every lockout (`kg × (perfect ? 2 : 1) × combo`), not only the heaviest — rewards both weight and precision.
- Game entrants are *not* written into the `leads` table (it requires phone + goal and the email nurture is drafted manually from Gmail). Instead `game_runs.marketingOptIn` is stored and the admin tab exports an entrants CSV with the opt-in column.
- Admin lives as a "Game" tab in the existing `/admin/leads` dashboard (where all other tabs live).
- Score-screen shop CTA links to `/shop` (no colour deep-link — that would require editing `Shop.tsx`).
- Sprites are code-defined pixel maps coloured per character (hair/skin/tee), not hand-drawn PNGs — swappable later.

## File map

| File | Responsibility |
|---|---|
| `shared/game/types.ts` | Character/lift IDs, input event, outcome types |
| `shared/game/config.ts` | Every tuning number |
| `shared/game/rng.ts` | Pure seeded random `randAt(seed, i)` |
| `shared/game/combo.ts` | Combo multiplier + `award()` |
| `shared/game/lift.ts` | `LiftSim` interface, `LiftRunner` (live + recording), `replayLift` |
| `shared/game/testHelpers.ts` | `stepUntil`, `tap`, `idle` for tests |
| `shared/game/bench.ts` / `squat.ts` / `deadlift.ts` | The three lift state machines |
| `shared/game/run.ts` | `LIFT_SIMS`, `liftSeed`, `replayRun` |
| `shared/game/validate.ts` | `checkLog`, `checkRun` (anti-cheat) |
| `drizzle/schema.ts` (+ migration) | `game_events`, `game_run_tokens`, `game_runs` |
| `server/gameDb.ts` | All game DB queries |
| `server/gameBoard.ts` | Pure leaderboard / CSV building |
| `server/routers/game.ts` | tRPC `game.*` (public + admin) |
| `client/src/game/content.ts` | Characters, quotes, pop-ups, easter-egg copy |
| `client/src/game/sprites.ts` | Pixel maps + drawing helpers |
| `client/src/game/audio.ts` | WebAudio chiptune SFX + music |
| `client/src/game/input.ts` | Unified tap/hold/space input |
| `client/src/game/circuit.ts` | Circuit sequencing (intro → lift → … → done) |
| `client/src/game/render.ts` | Canvas drawing for every phase |
| `client/src/game/CircuitCanvas.tsx` | Canvas + loop React component |
| `client/src/game/screens/*.tsx` | Title, Select, Results, Leaderboard |
| `client/src/game/gold.ts` | TRANSFORM-code gold skin persistence |
| `client/src/pages/Game.tsx` | Screen state machine for `/game` |
| `client/src/components/GameTab.tsx` | Admin tab |

---

### Task 1: Shared game foundations (types, config, rng, combo, LiftRunner)

**Files:**
- Create: `shared/game/types.ts`, `shared/game/config.ts`, `shared/game/rng.ts`, `shared/game/combo.ts`, `shared/game/lift.ts`, `shared/game/testHelpers.ts`
- Modify: `vitest.config.ts` (include shared tests)
- Test: `shared/game/lift.test.ts`

**Interfaces:**
- Produces: `Character`, `CHARACTERS`, `LiftId`, `LIFTS`, `InputEvent`, `Outcome`, `RunLogs`, `LiftScores` (types.ts); `TICK_MS`, `MIN_PRESS_GAP_TICKS`, `MAX_EVENTS_PER_LIFT`, `RUN_TOKEN_TTL_MS`, `BENCH`, `SQUAT`, `DEADLIFT`, `COMBO_STEP`, `COMBO_MAX_MULT` (config.ts); `randAt(seed, index): number` (rng.ts); `comboMultiplier(combo)`, `award(base, combo)` (combo.ts); `LiftStateBase`, `TickInput`, `LiftSim<S>`, `LiftRunner<S>` (`state`, `events`, `done`, `setDown(down)`, `advance()`), `replayLift(sim, seed, events): S` (lift.ts); `stepUntil`, `tap`, `idle` (testHelpers.ts).

- [ ] **Step 1: Let vitest pick up shared tests**

In `vitest.config.ts` change the `include` line to:

```ts
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "shared/**/*.test.ts"],
```

- [ ] **Step 2: Create `shared/game/types.ts`**

```ts
export const CHARACTERS = ["levi", "ruby", "benny"] as const;
export type Character = (typeof CHARACTERS)[number];

export const LIFTS = ["bench", "squat", "deadlift"] as const;
export type LiftId = (typeof LIFTS)[number];

/** A change in the single game input (tap/hold/space), stamped with the tick it applies from. */
export type InputEvent = { tick: number; down: boolean };

export type Outcome = "perfect" | "good" | "miss" | "tut" | "formbreak" | null;

export type RunLogs = Record<LiftId, InputEvent[]>;
export type LiftScores = Record<LiftId, number>;
```

- [ ] **Step 3: Create `shared/game/config.ts`**

```ts
/** Every gameplay tuning number lives here. Change these while playtesting, not the lift code. */

export const TICK_MS = 10;
/** Fastest a human can re-press (50 ms ≈ 20 taps/s). Faster presses are ignored client-side and rejected server-side. */
export const MIN_PRESS_GAP_TICKS = 5;
export const MAX_EVENTS_PER_LIFT = 1500;
export const RUN_TOKEN_TTL_MS = 10 * 60_000;

export const COMBO_STEP = 0.1;
export const COMBO_MAX_MULT = 2;

export const BENCH = {
  maxTicks: 2500,
  maxMisses: 3,
  zoneStart: 0.24,
  zoneMin: 0.08,
  zoneShrink: 0.015,
  /** Perfect band as a fraction of the green zone's width. */
  perfectFraction: 0.3,
  speedStart: 0.006,
  speedStep: 0.0006,
  speedMax: 0.02,
  goodPoints: 100,
  perfectPoints: 200,
  cooldownTicks: 30,
  startKg: 60,
  kgPerRep: 10,
} as const;

export const SQUAT = {
  maxTicks: 2000,
  drivePerPress: 0.12,
  gravityPerTick: 0.002,
  /** Presses closer together than this strain your form. */
  fastPressTicks: 9,
  strainPerFastPress: 0.25,
  strainDecayPerTick: 0.004,
  perfectStrainMax: 0.3,
  repPoints: 150,
  cooldownTicks: 40,
  formBreakCooldownTicks: 60,
  /** Sitting in a rep this long without pressing = chasing "time under tension". */
  tutIdleTicks: 150,
  tutPenalty: 50,
} as const;

export const DEADLIFT = {
  maxTicks: 2000,
  startKg: 100,
  kgStep: 20,
  gaugeRateStart: 0.008,
  gaugeRateStep: 0.001,
  sweetMin: 0.72,
  sweetMax: 0.9,
  perfectHalfWidth: 0.025,
  /** Releases below this are treated as an accidental tap, not a failed pull. */
  ignoreBelow: 0.05,
  cooldownTicks: 60,
} as const;
```

- [ ] **Step 4: Create `shared/game/rng.ts`**

```ts
/** Pure seeded random in [0, 1): the same (seed, index) always gives the same number, on client and server. */
export function randAt(seed: number, index: number): number {
  let t = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  t = (t + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
```

- [ ] **Step 5: Create `shared/game/combo.ts`**

```ts
import { COMBO_MAX_MULT, COMBO_STEP } from "./config";

export function comboMultiplier(combo: number): number {
  return Math.min(COMBO_MAX_MULT, 1 + COMBO_STEP * combo);
}

/** Points for one rep at the current combo. */
export function award(base: number, combo: number): number {
  return Math.round(base * comboMultiplier(combo));
}
```

- [ ] **Step 6: Create `shared/game/lift.ts`**

```ts
import { MAX_EVENTS_PER_LIFT, MIN_PRESS_GAP_TICKS } from "./config";
import type { InputEvent, LiftId, Outcome } from "./types";

export interface LiftStateBase {
  tick: number;
  done: boolean;
  score: number;
  combo: number;
  perfects: number;
  /** Last thing that happened, for pop-ups and sound. */
  outcome: Outcome;
  outcomeTick: number;
}

export type TickInput = { down: boolean; pressed: boolean; released: boolean };

/** A lift is a deterministic state machine advanced one 10 ms tick at a time. */
export interface LiftSim<S extends LiftStateBase> {
  id: LiftId;
  maxTicks: number;
  init(seed: number): S;
  step(s: S, input: TickInput): void;
}

/**
 * Runs a lift and records every input change with the tick it applies from.
 * The same class replays a recorded log on the server, so live and replayed runs can't diverge.
 */
export class LiftRunner<S extends LiftStateBase> {
  readonly state: S;
  readonly events: InputEvent[] = [];
  private down = false;
  private prevDown = false;
  private lastDownTick = -Infinity;
  private swallowing = false;

  constructor(private readonly sim: LiftSim<S>, seed: number) {
    this.state = sim.init(seed);
  }

  get done() {
    return this.state.done;
  }

  setDown(down: boolean) {
    if (this.state.done) return;
    if (!down && this.swallowing) {
      this.swallowing = false;
      return;
    }
    if (down === this.down) return;
    if (down) {
      const tooSoon = this.state.tick - this.lastDownTick < MIN_PRESS_GAP_TICKS;
      const full = this.events.length >= MAX_EVENTS_PER_LIFT - 1;
      if (tooSoon || full) {
        this.swallowing = true;
        return;
      }
      this.lastDownTick = this.state.tick;
    }
    this.down = down;
    this.events.push({ tick: this.state.tick, down });
  }

  advance() {
    if (this.state.done) return;
    const input: TickInput = {
      down: this.down,
      pressed: this.down && !this.prevDown,
      released: !this.down && this.prevDown,
    };
    this.prevDown = this.down;
    this.sim.step(this.state, input);
    this.state.tick++;
    if (this.state.tick >= this.sim.maxTicks) this.state.done = true;
  }
}

/** Re-run a lift from its input log. Used by the server to compute the real score. */
export function replayLift<S extends LiftStateBase>(sim: LiftSim<S>, seed: number, events: InputEvent[]): S {
  const r = new LiftRunner(sim, seed);
  let i = 0;
  while (!r.done) {
    while (i < events.length && events[i].tick <= r.state.tick) r.setDown(events[i++].down);
    r.advance();
  }
  return r.state;
}
```

- [ ] **Step 7: Create `shared/game/testHelpers.ts`**

```ts
import type { LiftRunner, LiftStateBase } from "./lift";

/** Advance until `pred` is true (checked before each tick). Returns false if the lift ended first. */
export function stepUntil<S extends LiftStateBase>(r: LiftRunner<S>, pred: (s: S) => boolean, limit = 10_000): boolean {
  for (let i = 0; i < limit && !r.done; i++) {
    if (pred(r.state)) return true;
    r.advance();
  }
  return !r.done && pred(r.state);
}

/** Press on this tick, release on the next. */
export function tap<S extends LiftStateBase>(r: LiftRunner<S>) {
  r.setDown(true);
  r.advance();
  r.setDown(false);
  r.advance();
}

export function idle<S extends LiftStateBase>(r: LiftRunner<S>, ticks: number) {
  for (let i = 0; i < ticks && !r.done; i++) r.advance();
}
```

- [ ] **Step 8: Write the failing tests — `shared/game/lift.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { award, comboMultiplier } from "./combo";
import { LiftRunner, replayLift, type LiftSim, type LiftStateBase } from "./lift";
import { randAt } from "./rng";

interface CountState extends LiftStateBase {
  presses: number;
}

const counter: LiftSim<CountState> = {
  id: "bench",
  maxTicks: 100,
  init: () => ({ tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0, presses: 0 }),
  step(s, input) {
    if (input.pressed) {
      s.presses++;
      s.score += 10;
    }
  },
};

describe("randAt", () => {
  it("is deterministic and within [0, 1)", () => {
    expect(randAt(42, 3)).toBe(randAt(42, 3));
    for (let i = 0; i < 100; i++) {
      const v = randAt(7, i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("changes with the index and the seed", () => {
    expect(randAt(42, 0)).not.toBe(randAt(42, 1));
    expect(randAt(42, 0)).not.toBe(randAt(43, 0));
  });
});

describe("combo", () => {
  it("adds 10% per combo step and caps at 2x", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(3)).toBeCloseTo(1.3);
    expect(comboMultiplier(50)).toBe(2);
    expect(award(200, 1)).toBe(220);
  });
});

describe("LiftRunner", () => {
  it("records input changes stamped with the tick they apply from", () => {
    const r = new LiftRunner(counter, 1);
    r.advance();
    r.advance();
    r.setDown(true);
    r.advance();
    r.setDown(false);
    r.advance();
    expect(r.events).toEqual([
      { tick: 2, down: true },
      { tick: 3, down: false },
    ]);
    expect(r.state.presses).toBe(1);
  });

  it("ignores a press that comes too soon after the last one", () => {
    const r = new LiftRunner(counter, 1);
    r.setDown(true);
    r.advance();
    r.setDown(false);
    r.advance();
    r.setDown(true); // tick 2: only 2 ticks after the first press
    r.advance();
    r.setDown(false);
    r.advance();
    expect(r.state.presses).toBe(1);
    expect(r.events).toHaveLength(2);
  });

  it("finishes at maxTicks and ignores input after", () => {
    const r = new LiftRunner(counter, 1);
    for (let i = 0; i < 150; i++) r.advance();
    expect(r.done).toBe(true);
    expect(r.state.tick).toBe(100);
    r.setDown(true);
    expect(r.events).toHaveLength(0);
  });

  it("replay reproduces a live run exactly", () => {
    const live = new LiftRunner(counter, 1);
    while (!live.done) {
      const t = live.state.tick;
      if (t % 7 === 0) live.setDown(true);
      if (t % 7 === 1) live.setDown(false);
      live.advance();
    }
    const replayed = replayLift(counter, 1, live.events);
    expect(replayed.presses).toBe(live.state.presses);
    expect(replayed.score).toBe(live.state.score);
    expect(replayed.tick).toBe(live.state.tick);
    expect(live.state.presses).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 9: Run tests**

Run: `pnpm vitest run shared/game/lift.test.ts`
Expected: all PASS (code was written first in this task because the test needs the module to import; if anything fails, fix the module, not the test).

- [ ] **Step 10: Type-check and commit**

Run: `pnpm check` — Expected: no errors.

```bash
git add vitest.config.ts shared/game
git commit -m "feat(game): shared lift runner, rng, combo and tuning config

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Bench press lift

**Files:**
- Create: `shared/game/bench.ts`
- Test: `shared/game/bench.test.ts`

**Interfaces:**
- Consumes: `LiftSim`, `LiftStateBase` (lift.ts), `BENCH` (config.ts), `randAt`, `award`.
- Produces: `BenchState` (`pos`, `dir`, `reps`, `misses`, `zoneCenter`, `zoneWidth`, `speed`, `cooldown`, `kg`, `seed` + base), `bench: LiftSim<BenchState>`.

- [ ] **Step 1: Write the failing test — `shared/game/bench.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { bench, type BenchState } from "./bench";
import { award } from "./combo";
import { BENCH } from "./config";
import { LiftRunner, replayLift } from "./lift";
import { stepUntil, tap } from "./testHelpers";

const SEED = 12345;
const off = (s: BenchState) => Math.abs(s.pos - s.zoneCenter);
const inCentre = (s: BenchState) => s.cooldown === 0 && off(s) < 0.01;
const inZoneNotCentre = (s: BenchState) => s.cooldown === 0 && off(s) > 0.05 && off(s) < 0.1;
const farAway = (s: BenchState) => s.cooldown === 0 && off(s) > 0.3;

describe("bench", () => {
  it("scores nothing and ends at the time limit with no input", () => {
    const s = replayLift(bench, SEED, []);
    expect(s.done).toBe(true);
    expect(s.tick).toBe(BENCH.maxTicks);
    expect(s.score).toBe(0);
  });

  it("a tap in the centre of the zone is a perfect rep", () => {
    const r = new LiftRunner(bench, SEED);
    expect(stepUntil(r, inCentre)).toBe(true);
    tap(r);
    expect(r.state.outcome).toBe("perfect");
    expect(r.state.score).toBe(BENCH.perfectPoints);
    expect(r.state.reps).toBe(1);
    expect(r.state.kg).toBe(BENCH.startKg + BENCH.kgPerRep);
    expect(r.state.combo).toBe(1);
  });

  it("perfects in a row build the combo", () => {
    const r = new LiftRunner(bench, SEED);
    stepUntil(r, inCentre);
    tap(r);
    stepUntil(r, inCentre);
    tap(r);
    expect(r.state.score).toBe(BENCH.perfectPoints + award(BENCH.perfectPoints, 1));
  });

  it("a tap in the zone but off-centre is a good rep with no combo", () => {
    const r = new LiftRunner(bench, SEED);
    expect(stepUntil(r, inZoneNotCentre)).toBe(true);
    tap(r);
    expect(r.state.outcome).toBe("good");
    expect(r.state.score).toBe(BENCH.goodPoints);
    expect(r.state.combo).toBe(0);
  });

  it("three misses end the set", () => {
    const r = new LiftRunner(bench, SEED);
    for (let i = 0; i < 3; i++) {
      expect(stepUntil(r, farAway)).toBe(true);
      tap(r);
    }
    expect(r.state.done).toBe(true);
    expect(r.state.misses).toBe(3);
    expect(r.state.score).toBe(0);
  });

  it("the zone shrinks and the marker speeds up each rep", () => {
    const r = new LiftRunner(bench, SEED);
    stepUntil(r, inCentre);
    tap(r);
    expect(r.state.zoneWidth).toBeCloseTo(BENCH.zoneStart - BENCH.zoneShrink);
    expect(r.state.speed).toBeCloseTo(BENCH.speedStart + BENCH.speedStep);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run shared/game/bench.test.ts`
Expected: FAIL — cannot resolve `./bench`.

- [ ] **Step 3: Implement `shared/game/bench.ts`**

```ts
import { award } from "./combo";
import { BENCH } from "./config";
import type { LiftSim, LiftStateBase } from "./lift";
import { randAt } from "./rng";

export interface BenchState extends LiftStateBase {
  seed: number;
  /** Marker position across the meter, 0..1. */
  pos: number;
  dir: 1 | -1;
  reps: number;
  misses: number;
  zoneCenter: number;
  zoneWidth: number;
  speed: number;
  cooldown: number;
  /** Bar weight shown on screen (cosmetic). */
  kg: number;
}

function zoneFor(seed: number, reps: number) {
  return {
    center: 0.2 + 0.6 * randAt(seed, reps),
    width: Math.max(BENCH.zoneMin, BENCH.zoneStart - BENCH.zoneShrink * reps),
  };
}

/** Timing meter: tap while the sweeping marker is in the green zone. */
export const bench: LiftSim<BenchState> = {
  id: "bench",
  maxTicks: BENCH.maxTicks,

  init(seed) {
    const z = zoneFor(seed, 0);
    return {
      tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0,
      seed, pos: 0, dir: 1, reps: 0, misses: 0,
      zoneCenter: z.center, zoneWidth: z.width,
      speed: BENCH.speedStart, cooldown: 0, kg: BENCH.startKg,
    };
  },

  step(s, input) {
    if (s.cooldown > 0) {
      s.cooldown--;
      return;
    }
    if (input.pressed) {
      const off = Math.abs(s.pos - s.zoneCenter);
      s.outcomeTick = s.tick;
      s.cooldown = BENCH.cooldownTicks;
      if (off <= (s.zoneWidth * BENCH.perfectFraction) / 2) {
        s.outcome = "perfect";
        s.score += award(BENCH.perfectPoints, s.combo);
        s.combo++;
        s.perfects++;
      } else if (off <= s.zoneWidth / 2) {
        s.outcome = "good";
        s.score += award(BENCH.goodPoints, s.combo);
      } else {
        s.outcome = "miss";
        s.combo = 0;
        s.misses++;
        if (s.misses >= BENCH.maxMisses) s.done = true;
        return;
      }
      s.reps++;
      s.kg = BENCH.startKg + BENCH.kgPerRep * s.reps;
      const z = zoneFor(s.seed, s.reps);
      s.zoneCenter = z.center;
      s.zoneWidth = z.width;
      s.speed = Math.min(BENCH.speedMax, BENCH.speedStart + BENCH.speedStep * s.reps);
      return;
    }
    s.pos += s.speed * s.dir;
    if (s.pos >= 1) {
      s.pos = 2 - s.pos;
      s.dir = -1;
    } else if (s.pos <= 0) {
      s.pos = -s.pos;
      s.dir = 1;
    }
  },
};
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run shared/game/bench.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/game/bench.ts shared/game/bench.test.ts
git commit -m "feat(game): bench press timing-meter lift

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Squat lift (mash + form meter + TUT trap)

**Files:**
- Create: `shared/game/squat.ts`
- Test: `shared/game/squat.test.ts`

**Interfaces:**
- Consumes: `LiftSim`, `LiftStateBase`, `SQUAT`, `award`.
- Produces: `SquatState` (`progress`, `strain`, `lastPressTick`, `idleTicks`, `reps`, `cooldown`, `tutTriggers`, `formBreaks` + base), `squat: LiftSim<SquatState>`.

- [ ] **Step 1: Write the failing test — `shared/game/squat.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { SQUAT } from "./config";
import { LiftRunner, replayLift } from "./lift";
import { squat, type SquatState } from "./squat";
import { idle, tap } from "./testHelpers";

function tapEvery(r: LiftRunner<SquatState>, gap: number, until: (s: SquatState) => boolean, limit = 500) {
  for (let i = 0; i < limit && !r.done && !until(r.state); i++) {
    tap(r);
    idle(r, gap - 2);
  }
}

describe("squat", () => {
  it("ends at the time limit with no input", () => {
    const s = replayLift(squat, 1, []);
    expect(s.done).toBe(true);
    expect(s.tick).toBe(SQUAT.maxTicks);
    expect(s.score).toBe(0);
  });

  it("steady presses drive a clean, perfect rep", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, 12, (s) => s.reps === 1);
    expect(r.state.reps).toBe(1);
    expect(r.state.outcome).toBe("perfect");
    expect(r.state.score).toBe(SQUAT.repPoints);
    expect(r.state.combo).toBe(1);
  });

  it("mashing as fast as possible breaks form and loses the rep", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, 5, (s) => s.formBreaks > 0);
    expect(r.state.formBreaks).toBe(1);
    expect(r.state.reps).toBe(0);
    expect(r.state.outcome).toBe("formbreak");
    expect(r.state.progress).toBe(0);
  });

  it("grinding a rep slowly triggers the TUT trap", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, 12, (s) => s.progress > 0.5);
    idle(r, SQUAT.tutIdleTicks);
    expect(r.state.tutTriggers).toBe(1);
    expect(r.state.outcome).toBe("tut");
    expect(r.state.progress).toBe(0);
    expect(r.state.score).toBe(0);
  });

  it("the TUT penalty comes off points already earned", () => {
    const r = new LiftRunner(squat, 1);
    tapEvery(r, 12, (s) => s.reps === 1);
    idle(r, SQUAT.cooldownTicks);
    tapEvery(r, 12, (s) => s.progress > 0.5);
    idle(r, SQUAT.tutIdleTicks);
    expect(r.state.score).toBe(SQUAT.repPoints - SQUAT.tutPenalty);
    expect(r.state.combo).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run shared/game/squat.test.ts`
Expected: FAIL — cannot resolve `./squat`.

- [ ] **Step 3: Implement `shared/game/squat.ts`**

```ts
import { award } from "./combo";
import { SQUAT } from "./config";
import type { LiftSim, LiftStateBase } from "./lift";

export interface SquatState extends LiftStateBase {
  /** 0 = bottom of the squat, 1 = locked out. */
  progress: number;
  /** Form strain; at 1 the rep is lost. */
  strain: number;
  lastPressTick: number;
  idleTicks: number;
  reps: number;
  cooldown: number;
  tutTriggers: number;
  formBreaks: number;
}

/** Mash to drive out of the hole — but mash too fast and your form breaks. Grind too slow and Levi calls out your TUT. */
export const squat: LiftSim<SquatState> = {
  id: "squat",
  maxTicks: SQUAT.maxTicks,

  init() {
    return {
      tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0,
      progress: 0, strain: 0, lastPressTick: -1000, idleTicks: 0, reps: 0, cooldown: 0, tutTriggers: 0, formBreaks: 0,
    };
  },

  step(s, input) {
    s.strain = Math.max(0, s.strain - SQUAT.strainDecayPerTick);
    if (s.cooldown > 0) {
      s.cooldown--;
      return;
    }
    if (input.pressed) {
      if (s.tick - s.lastPressTick < SQUAT.fastPressTicks) s.strain += SQUAT.strainPerFastPress;
      s.lastPressTick = s.tick;
      s.idleTicks = 0;
      if (s.strain >= 1) {
        s.outcome = "formbreak";
        s.outcomeTick = s.tick;
        s.formBreaks++;
        s.combo = 0;
        s.progress = 0;
        s.strain = 0;
        s.cooldown = SQUAT.formBreakCooldownTicks;
        return;
      }
      s.progress += SQUAT.drivePerPress;
      if (s.progress >= 1) {
        const perfect = s.strain <= SQUAT.perfectStrainMax;
        s.outcome = perfect ? "perfect" : "good";
        s.outcomeTick = s.tick;
        s.score += award(SQUAT.repPoints, s.combo);
        if (perfect) {
          s.combo++;
          s.perfects++;
        }
        s.reps++;
        s.progress = 0;
        s.cooldown = SQUAT.cooldownTicks;
      }
      return;
    }
    if (s.progress > 0) {
      s.progress = Math.max(0, s.progress - SQUAT.gravityPerTick);
      s.idleTicks++;
      if (s.idleTicks >= SQUAT.tutIdleTicks) {
        s.outcome = "tut";
        s.outcomeTick = s.tick;
        s.tutTriggers++;
        s.combo = 0;
        s.score = Math.max(0, s.score - SQUAT.tutPenalty);
        s.progress = 0;
        s.idleTicks = 0;
      }
    }
  },
};
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run shared/game/squat.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/game/squat.ts shared/game/squat.test.ts
git commit -m "feat(game): squat mash lift with form meter and TUT trap

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Deadlift lift (hold + release in sweet spot)

**Files:**
- Create: `shared/game/deadlift.ts`
- Test: `shared/game/deadlift.test.ts`

**Interfaces:**
- Consumes: `LiftSim`, `LiftStateBase`, `DEADLIFT`, `award`.
- Produces: `DeadliftState` (`gauge`, `pulling`, `attempt`, `kg`, `bestKg`, `cooldown`, `needRelease` + base), `deadlift: LiftSim<DeadliftState>`, `DEADLIFT_CENTRE: number`.

- [ ] **Step 1: Write the failing test — `shared/game/deadlift.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { award } from "./combo";
import { DEADLIFT } from "./config";
import { deadlift, DEADLIFT_CENTRE, type DeadliftState } from "./deadlift";
import { LiftRunner, replayLift } from "./lift";
import { idle, stepUntil, tap } from "./testHelpers";

function pullTo(r: LiftRunner<DeadliftState>, pred: (s: DeadliftState) => boolean) {
  r.setDown(true);
  r.advance();
  expect(stepUntil(r, (s) => s.pulling && pred(s))).toBe(true);
  r.setDown(false);
  r.advance();
}

describe("deadlift", () => {
  it("ends at the time limit with no input", () => {
    const s = replayLift(deadlift, 1, []);
    expect(s.done).toBe(true);
    expect(s.tick).toBe(DEADLIFT.maxTicks);
  });

  it("releasing dead-centre is a perfect lockout worth double", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => Math.abs(s.gauge - DEADLIFT_CENTRE) < 0.005);
    expect(r.state.outcome).toBe("perfect");
    expect(r.state.score).toBe(DEADLIFT.startKg * 2);
    expect(r.state.bestKg).toBe(DEADLIFT.startKg);
    expect(r.state.kg).toBe(DEADLIFT.startKg + DEADLIFT.kgStep);
    expect(r.state.done).toBe(false);
  });

  it("releasing inside the sweet spot but off-centre is a good lockout", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => s.gauge > DEADLIFT.sweetMin + 0.01 && s.gauge < DEADLIFT_CENTRE - 0.04);
    expect(r.state.outcome).toBe("good");
    expect(r.state.score).toBe(DEADLIFT.startKg);
    expect(r.state.combo).toBe(0);
  });

  it("releasing early fails the lift and ends it", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => s.gauge > 0.4 && s.gauge < 0.6);
    expect(r.state.outcome).toBe("miss");
    expect(r.state.done).toBe(true);
  });

  it("holding too long fails the lift", () => {
    const r = new LiftRunner(deadlift, 1);
    r.setDown(true);
    idle(r, 300);
    expect(r.state.outcome).toBe("miss");
    expect(r.state.done).toBe(true);
  });

  it("an accidental quick tap is ignored", () => {
    const r = new LiftRunner(deadlift, 1);
    tap(r);
    expect(r.state.done).toBe(false);
    expect(r.state.outcome).toBe(null);
    expect(r.state.pulling).toBe(false);
  });

  it("each lockout loads more weight and keeps the combo", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => Math.abs(s.gauge - DEADLIFT_CENTRE) < 0.005);
    idle(r, DEADLIFT.cooldownTicks);
    pullTo(r, (s) => Math.abs(s.gauge - DEADLIFT_CENTRE) < 0.005);
    const second = DEADLIFT.startKg + DEADLIFT.kgStep;
    expect(r.state.score).toBe(DEADLIFT.startKg * 2 + award(second * 2, 1));
    expect(r.state.bestKg).toBe(second);
  });

  it("holding through the plate change requires a fresh press", () => {
    const r = new LiftRunner(deadlift, 1);
    pullTo(r, (s) => Math.abs(s.gauge - DEADLIFT_CENTRE) < 0.005);
    r.setDown(true);
    idle(r, DEADLIFT.cooldownTicks + 10);
    expect(r.state.pulling).toBe(false);
    expect(r.state.gauge).toBe(0);
    r.setDown(false);
    r.advance();
    r.setDown(true);
    r.advance();
    expect(r.state.pulling).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run shared/game/deadlift.test.ts`
Expected: FAIL — cannot resolve `./deadlift`.

- [ ] **Step 3: Implement `shared/game/deadlift.ts`**

```ts
import { award } from "./combo";
import { DEADLIFT } from "./config";
import type { LiftSim, LiftStateBase } from "./lift";

export const DEADLIFT_CENTRE = (DEADLIFT.sweetMin + DEADLIFT.sweetMax) / 2;

export interface DeadliftState extends LiftStateBase {
  /** Power gauge 0..1 while pulling. */
  gauge: number;
  pulling: boolean;
  attempt: number;
  /** Weight on the bar for the current attempt. */
  kg: number;
  bestKg: number;
  cooldown: number;
  /** Player was still holding when the plates finished loading — must let go first. */
  needRelease: boolean;
}

function fail(s: DeadliftState) {
  s.outcome = "miss";
  s.outcomeTick = s.tick;
  s.combo = 0;
  s.pulling = false;
  s.done = true;
}

/** Hold to pull, release in the sweet spot to lock out. Plates get heavier every lockout; one miss ends it. */
export const deadlift: LiftSim<DeadliftState> = {
  id: "deadlift",
  maxTicks: DEADLIFT.maxTicks,

  init() {
    return {
      tick: 0, done: false, score: 0, combo: 0, perfects: 0, outcome: null, outcomeTick: 0,
      gauge: 0, pulling: false, attempt: 0, kg: DEADLIFT.startKg, bestKg: 0, cooldown: 0, needRelease: false,
    };
  },

  step(s, input) {
    if (s.cooldown > 0) {
      s.cooldown--;
      if (s.cooldown === 0) s.needRelease = input.down;
      return;
    }
    if (s.needRelease) {
      if (!input.down) s.needRelease = false;
      return;
    }
    if (!s.pulling) {
      if (input.pressed) {
        s.pulling = true;
        s.gauge = 0;
      }
      return;
    }
    if (input.down) {
      s.gauge += DEADLIFT.gaugeRateStart + DEADLIFT.gaugeRateStep * s.attempt;
      if (s.gauge >= 1) fail(s);
      return;
    }
    // Released.
    s.pulling = false;
    if (s.gauge < DEADLIFT.ignoreBelow) {
      s.gauge = 0;
      return;
    }
    if (s.gauge < DEADLIFT.sweetMin || s.gauge > DEADLIFT.sweetMax) {
      fail(s);
      return;
    }
    const perfect = Math.abs(s.gauge - DEADLIFT_CENTRE) <= DEADLIFT.perfectHalfWidth;
    s.outcome = perfect ? "perfect" : "good";
    s.outcomeTick = s.tick;
    s.score += award(s.kg * (perfect ? 2 : 1), s.combo);
    if (perfect) {
      s.combo++;
      s.perfects++;
    }
    s.bestKg = s.kg;
    s.attempt++;
    s.kg += DEADLIFT.kgStep;
    s.gauge = 0;
    s.cooldown = DEADLIFT.cooldownTicks;
  },
};
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run shared/game/deadlift.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/game/deadlift.ts shared/game/deadlift.test.ts
git commit -m "feat(game): deadlift hold-and-release lift

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Run replay + anti-cheat validation

**Files:**
- Create: `shared/game/run.ts`, `shared/game/validate.ts`
- Test: `shared/game/validate.test.ts`

**Interfaces:**
- Consumes: `bench`, `squat`, `deadlift`, `replayLift`, config constants, types.
- Produces: `LIFT_SIMS: { bench; squat; deadlift }`, `liftSeed(seed, lift): number`, `replayRun(seed, logs): { scores: LiftScores; total: number; ticks: number }` (run.ts); `checkLog(lift, events): string | null`, `checkRun(seed, logs, elapsedMs): RunCheck` where `RunCheck = { ok: true; scores; total; ticks } | { ok: false; reason: string }` (validate.ts).

- [ ] **Step 1: Write the failing test — `shared/game/validate.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import type { BenchState } from "./bench";
import { BENCH, DEADLIFT, MAX_EVENTS_PER_LIFT, RUN_TOKEN_TTL_MS, SQUAT, TICK_MS } from "./config";
import { LiftRunner } from "./lift";
import { LIFT_SIMS, liftSeed, replayRun } from "./run";
import { idle, stepUntil, tap } from "./testHelpers";
import type { RunLogs } from "./types";
import { checkLog, checkRun } from "./validate";

const SEED = 987654;
const ALL_TICKS = BENCH.maxTicks + SQUAT.maxTicks + DEADLIFT.maxTicks;
const empty: RunLogs = { bench: [], squat: [], deadlift: [] };

/** A real run: one perfect bench rep, then nothing. */
function liveRun() {
  const b = new LiftRunner(LIFT_SIMS.bench, liftSeed(SEED, "bench"));
  stepUntil(b, (s: BenchState) => s.cooldown === 0 && Math.abs(s.pos - s.zoneCenter) < 0.01);
  tap(b);
  idle(b, 100_000);
  const logs: RunLogs = { bench: b.events, squat: [], deadlift: [] };
  return { logs, benchScore: b.state.score, ticks: b.state.tick + SQUAT.maxTicks + DEADLIFT.maxTicks };
}

describe("replayRun", () => {
  it("scores an empty run as zero and runs every lift to its limit", () => {
    const r = replayRun(SEED, empty);
    expect(r.total).toBe(0);
    expect(r.ticks).toBe(ALL_TICKS);
  });

  it("gives each lift its own seed", () => {
    expect(liftSeed(SEED, "bench")).not.toBe(liftSeed(SEED, "squat"));
  });

  it("matches what the player saw live", () => {
    const live = liveRun();
    const r = replayRun(SEED, live.logs);
    expect(r.scores.bench).toBe(live.benchScore);
    expect(r.total).toBe(BENCH.perfectPoints);
  });
});

describe("checkLog", () => {
  it("accepts a clean log", () => {
    expect(checkLog("squat", [{ tick: 0, down: true }, { tick: 2, down: false }, { tick: 10, down: true }])).toBeNull();
  });
  it("rejects a log that starts with a release", () => {
    expect(checkLog("squat", [{ tick: 0, down: false }])).toMatch(/alternating/);
  });
  it("rejects out-of-order ticks", () => {
    expect(checkLog("squat", [{ tick: 10, down: true }, { tick: 5, down: false }])).toMatch(/order/);
  });
  it("rejects inhumanly fast presses", () => {
    expect(
      checkLog("squat", [{ tick: 0, down: true }, { tick: 1, down: false }, { tick: 3, down: true }]),
    ).toMatch(/too fast/);
  });
  it("rejects ticks past the lift's time limit", () => {
    expect(checkLog("squat", [{ tick: SQUAT.maxTicks, down: true }])).toMatch(/range/);
  });
  it("rejects absurdly long logs", () => {
    const events = Array.from({ length: MAX_EVENTS_PER_LIFT + 2 }, (_, i) => ({ tick: i * 5, down: i % 2 === 0 }));
    expect(checkLog("squat", events)).toMatch(/too many/);
  });
});

describe("checkRun", () => {
  it("accepts a genuine run played in real time", () => {
    const live = liveRun();
    const res = checkRun(SEED, live.logs, live.ticks * TICK_MS + 5000);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.total).toBe(BENCH.perfectPoints);
  });

  it("rejects a run submitted faster than it could be played", () => {
    const live = liveRun();
    const res = checkRun(SEED, live.logs, 1000);
    expect(res).toEqual({ ok: false, reason: "finished too fast" });
  });

  it("rejects a run older than the token lifetime", () => {
    const res = checkRun(SEED, empty, RUN_TOKEN_TTL_MS + 1);
    expect(res).toEqual({ ok: false, reason: "run expired" });
  });

  it("rejects a bad log in any lift", () => {
    const res = checkRun(SEED, { ...empty, deadlift: [{ tick: 0, down: false }] }, 70_000);
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run shared/game/validate.test.ts`
Expected: FAIL — cannot resolve `./run`.

- [ ] **Step 3: Implement `shared/game/run.ts`**

```ts
import { bench } from "./bench";
import { deadlift } from "./deadlift";
import { replayLift, type LiftSim, type LiftStateBase } from "./lift";
import { squat } from "./squat";
import { LIFTS, type LiftId, type LiftScores, type RunLogs } from "./types";

export const LIFT_SIMS = { bench, squat, deadlift } as const;

/** Each lift gets its own seed derived from the run's seed. */
export function liftSeed(seed: number, lift: LiftId): number {
  return (seed ^ Math.imul(LIFTS.indexOf(lift) + 1, 0x85ebca6b)) >>> 0;
}

export function replayRun(seed: number, logs: RunLogs): { scores: LiftScores; total: number; ticks: number } {
  const scores = { bench: 0, squat: 0, deadlift: 0 } as LiftScores;
  let ticks = 0;
  for (const lift of LIFTS) {
    // Each sim has its own state type; the shared base is all we read here.
    const sim: LiftSim<LiftStateBase> = LIFT_SIMS[lift];
    const state = replayLift(sim, liftSeed(seed, lift), logs[lift]);
    scores[lift] = state.score;
    ticks += state.tick;
  }
  return { scores, total: scores.bench + scores.squat + scores.deadlift, ticks };
}
```

- [ ] **Step 4: Implement `shared/game/validate.ts`**

```ts
import { MAX_EVENTS_PER_LIFT, MIN_PRESS_GAP_TICKS, RUN_TOKEN_TTL_MS, TICK_MS } from "./config";
import { LIFT_SIMS, replayRun } from "./run";
import { LIFTS, type InputEvent, type LiftId, type LiftScores, type RunLogs } from "./types";

export type RunCheck =
  | { ok: true; scores: LiftScores; total: number; ticks: number }
  | { ok: false; reason: string };

/** Is this an input log a human on a real device could have produced? Returns a reason if not. */
export function checkLog(lift: LiftId, events: InputEvent[]): string | null {
  if (events.length > MAX_EVENTS_PER_LIFT) return "too many events";
  const maxTicks = LIFT_SIMS[lift].maxTicks;
  let lastTick = -1;
  let expectDown = true;
  let lastDownTick = -Infinity;
  for (const e of events) {
    if (!Number.isInteger(e.tick) || e.tick < 0 || e.tick >= maxTicks) return "tick out of range";
    if (e.tick < lastTick) return "ticks out of order";
    if (e.down !== expectDown) return "events not alternating";
    if (e.down) {
      if (e.tick - lastDownTick < MIN_PRESS_GAP_TICKS) return "presses too fast";
      lastDownTick = e.tick;
    }
    lastTick = e.tick;
    expectDown = !expectDown;
  }
  return null;
}

/**
 * Re-score a submitted run from its input logs and check it was played in real time.
 * `elapsedMs` = server time between issuing the run token and receiving the submission.
 */
export function checkRun(seed: number, logs: RunLogs, elapsedMs: number): RunCheck {
  for (const lift of LIFTS) {
    const reason = checkLog(lift, logs[lift]);
    if (reason) return { ok: false, reason: `${lift}: ${reason}` };
  }
  if (elapsedMs > RUN_TOKEN_TTL_MS) return { ok: false, reason: "run expired" };
  const result = replayRun(seed, logs);
  if (elapsedMs < result.ticks * TICK_MS * 0.8) return { ok: false, reason: "finished too fast" };
  return { ok: true, ...result };
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run shared/game`
Expected: all shared game tests PASS.

- [ ] **Step 6: Commit**

```bash
git add shared/game/run.ts shared/game/validate.ts shared/game/validate.test.ts
git commit -m "feat(game): run replay and anti-cheat validation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Database tables, migration, and query module

**Files:**
- Modify: `drizzle/schema.ts` (append at end)
- Create: `drizzle/0012_lff_gym_game.sql` (generated), `server/gameDb.ts`
- Modify: drizzle meta files (generated)

**Interfaces:**
- Produces (schema): `gameEvents`, `gameRunTokens`, `gameRuns`, types `GameEvent`, `GameRunToken`, `GameRun`, `InsertGameRun`.
- Produces (gameDb.ts): `getActiveEvent(now?: Date): Promise<GameEvent | null>`, `getCurrentEvent(): Promise<GameEvent | null>`, `createRunToken(t: { id: string; seed: number; character: Character }): Promise<void>`, `getRunToken(id: string): Promise<GameRunToken | null>`, `markRunTokenUsed(id: string): Promise<boolean>`, `insertRun(run: InsertGameRun): Promise<void>`, `getEventRuns(eventId: number): Promise<GameRun[]>`, `listEventRunsForAdmin(eventId: number): Promise<GameRun[]>`, `setRunRemoved(id: number, removed: boolean): Promise<void>`, `startEvent(e: { name: string; startsAt: Date; endsAt: Date }): Promise<void>`.

- [ ] **Step 1: Append tables to `drizzle/schema.ts`**

`boolean`, `bigint`, `int`, `mysqlTable`, `timestamp`, `varchar` are already imported on line 1. Append:

```ts

/**
 * LFF Gym — the 8-bit workout game at /game.
 * One active event (e.g. a two-week tee giveaway) at a time.
 */
export const gameEvents = mysqlTable("game_events", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameEvent = typeof gameEvents.$inferSelect;

/** One-time tickets handed out when a run starts. The seed makes the run replayable server-side. */
export const gameRunTokens = mysqlTable("game_run_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  seed: bigint("seed", { mode: "number" }).notNull(),
  character: varchar("character", { length: 16 }).notNull(),
  issuedAt: timestamp("issuedAt").notNull(),
  usedAt: timestamp("usedAt"),
});

export type GameRunToken = typeof gameRunTokens.$inferSelect;

/** Verified, finished runs. Scores are recomputed server-side from the input log. */
export const gameRuns = mysqlTable("game_runs", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  handle: varchar("handle", { length: 31 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  marketingOptIn: boolean("marketingOptIn").default(false).notNull(),
  character: varchar("character", { length: 16 }).notNull(),
  benchScore: int("benchScore").notNull(),
  squatScore: int("squatScore").notNull(),
  deadliftScore: int("deadliftScore").notNull(),
  total: int("total").notNull(),
  runTokenId: varchar("runTokenId", { length: 36 }).notNull().unique(),
  ipHash: varchar("ipHash", { length: 64 }).notNull(),
  removed: boolean("removed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameRun = typeof gameRuns.$inferSelect;
export type InsertGameRun = typeof gameRuns.$inferInsert;
```

- [ ] **Step 2: Generate the migration (offline — no DB connection)**

`drizzle.config.ts` throws without `DATABASE_URL`; `generate` never connects, so pass a dummy one. **Do not run `pnpm db:push` or `drizzle-kit migrate`.**

Run: `DATABASE_URL=mysql://offline:offline@127.0.0.1:1/none pnpm drizzle-kit generate --name lff_gym_game`
Expected: creates `drizzle/0012_lff_gym_game.sql` and updates `drizzle/meta/_journal.json` + a new snapshot.

- [ ] **Step 3: Inspect the generated SQL**

Run: `cat drizzle/0012_lff_gym_game.sql`
Expected: exactly three `CREATE TABLE` statements (`game_events`, `game_run_tokens`, `game_runs`) plus the `game_runs_runTokenId_unique` constraint. If drizzle also emitted statements for other tables (e.g. `ALTER TABLE leads ADD contact_method` — that column was added by a hand-written migration and may be missing from older snapshots), **delete those statements from the .sql file** so it only touches `game_*` tables. Keep the snapshot as generated.

- [ ] **Step 4: Create `server/gameDb.ts`**

```ts
import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import type { Character } from "@shared/game/types";
import {
  gameEvents,
  gameRuns,
  gameRunTokens,
  type GameEvent,
  type GameRun,
  type GameRunToken,
  type InsertGameRun,
} from "../drizzle/schema";
import { getDb } from "./db";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

/** The event that's open for submissions right now, if any. */
export async function getActiveEvent(now = new Date()): Promise<GameEvent | null> {
  const rows = await (await db())
    .select()
    .from(gameEvents)
    .where(and(eq(gameEvents.isActive, true), lte(gameEvents.startsAt, now), gte(gameEvents.endsAt, now)))
    .orderBy(desc(gameEvents.id))
    .limit(1);
  return rows[0] ?? null;
}

/** The latest active event regardless of dates — the board shows it before it opens and after it ends. */
export async function getCurrentEvent(): Promise<GameEvent | null> {
  const rows = await (await db())
    .select()
    .from(gameEvents)
    .where(eq(gameEvents.isActive, true))
    .orderBy(desc(gameEvents.id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createRunToken(t: { id: string; seed: number; character: Character }): Promise<void> {
  await (await db()).insert(gameRunTokens).values({ ...t, issuedAt: new Date() });
}

export async function getRunToken(id: string): Promise<GameRunToken | null> {
  const rows = await (await db()).select().from(gameRunTokens).where(eq(gameRunTokens.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Atomically claims the token. False if it was already used (double submit / replayed request). */
export async function markRunTokenUsed(id: string): Promise<boolean> {
  const [result] = await (await db())
    .update(gameRunTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(gameRunTokens.id, id), isNull(gameRunTokens.usedAt)));
  return result.affectedRows === 1;
}

export async function insertRun(run: InsertGameRun): Promise<void> {
  await (await db()).insert(gameRuns).values(run);
}

/** Counted runs for an event, best first. */
export async function getEventRuns(eventId: number): Promise<GameRun[]> {
  return (await db())
    .select()
    .from(gameRuns)
    .where(and(eq(gameRuns.eventId, eventId), eq(gameRuns.removed, false)))
    .orderBy(desc(gameRuns.total))
    .limit(5000);
}

/** Every run for an event including removed ones, newest first. Admin only. */
export async function listEventRunsForAdmin(eventId: number): Promise<GameRun[]> {
  return (await db())
    .select()
    .from(gameRuns)
    .where(eq(gameRuns.eventId, eventId))
    .orderBy(desc(gameRuns.createdAt))
    .limit(1000);
}

export async function setRunRemoved(id: number, removed: boolean): Promise<void> {
  await (await db()).update(gameRuns).set({ removed }).where(eq(gameRuns.id, id));
}

/** Starts a new event and retires the old one (its runs stay in the DB). */
export async function startEvent(e: { name: string; startsAt: Date; endsAt: Date }): Promise<void> {
  const d = await db();
  await d.update(gameEvents).set({ isActive: false }).where(eq(gameEvents.isActive, true));
  await d.insert(gameEvents).values({ ...e, isActive: true });
}
```

- [ ] **Step 5: Type-check**

Run: `pnpm check`
Expected: no errors. If `result.affectedRows` errors, the mysql2 update result type differs — use `(result as { affectedRows: number }).affectedRows`.

- [ ] **Step 6: Commit**

```bash
git add drizzle/schema.ts drizzle/0012_lff_gym_game.sql drizzle/meta server/gameDb.ts
git commit -m "feat(game): game tables, migration and query module

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Leaderboard building + public game API

**Files:**
- Create: `server/gameBoard.ts`, `server/routers/game.ts`
- Modify: `server/_core/systemRouter.ts:9` (export `clientIp`), `server/routers.ts` (mount `game`)
- Test: `server/gameBoard.test.ts`, `server/game.test.ts`

**Interfaces:**
- Consumes: everything in `server/gameDb.ts`; `checkRun`; `CHARACTERS`; `MAX_EVENTS_PER_LIFT`.
- Produces: `buildBoard(runs): { rows: BoardRow[]; teams: TeamRow[]; ranks: Map<string, number> }`, `entrantsCsv(runs): string`, `BoardRow = { rank; handle; character; total }`, `TeamRow = { character; players; top }` (gameBoard.ts); tRPC `game.startRun({ character }) → { runId, seed, eventOpen }`, `game.submitRun({ runId, handle, email, marketingOptIn, logs }) → { total, scores, rank }`, `game.leaderboard() → { event: { name; startsAt; endsAt } | null; rows: BoardRow[]; teams: TeamRow[] }`, `resetGameRateLimits()`.

- [ ] **Step 1: Write the failing test — `server/gameBoard.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { buildBoard, entrantsCsv } from "./gameBoard";

const run = (email: string, handle: string, character: string, total: number, marketingOptIn = false) =>
  ({ email, handle, character, total, marketingOptIn });

describe("buildBoard", () => {
  it("keeps each player's best run only, best first", () => {
    const board = buildBoard([
      run("a@x.com", "amy", "ruby", 500),
      run("b@x.com", "bob", "benny", 900),
      run("A@x.com", "amy", "levi", 700),
    ]);
    expect(board.rows).toEqual([
      { rank: 1, handle: "bob", character: "benny", total: 900 },
      { rank: 2, handle: "amy", character: "levi", total: 700 },
    ]);
    expect(board.ranks.get("a@x.com")).toBe(2);
  });

  it("totals players and top score per team", () => {
    const board = buildBoard([run("a@x.com", "amy", "ruby", 500), run("b@x.com", "bob", "ruby", 300)]);
    expect(board.teams).toEqual([
      { character: "levi", players: 0, top: 0 },
      { character: "ruby", players: 2, top: 500 },
      { character: "benny", players: 0, top: 0 },
    ]);
  });
});

describe("entrantsCsv", () => {
  it("one row per player with best score, run count and opt-in", () => {
    const csv = entrantsCsv([
      run("a@x.com", "amy", "ruby", 500, false),
      run("a@x.com", "amy", "ruby", 800, true),
      run("b@x.com", 'b"ob', "benny", 100),
    ]);
    expect(csv.split("\n")).toEqual([
      "handle,email,character,best,runs,marketing_opt_in",
      '"amy","a@x.com","ruby",800,2,yes',
      '"b""ob","b@x.com","benny",100,1,no',
    ]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run server/gameBoard.test.ts`
Expected: FAIL — cannot resolve `./gameBoard`.

- [ ] **Step 3: Implement `server/gameBoard.ts`**

```ts
import { CHARACTERS, type Character } from "@shared/game/types";

type RunLike = { email: string; handle: string; character: string; total: number; marketingOptIn?: boolean };

export type BoardRow = { rank: number; handle: string; character: Character; total: number };
export type TeamRow = { character: Character; players: number; top: number };

/** Best run per player (by email), ranked. Emails stay server-side — only `ranks` is keyed by them. */
export function buildBoard(runs: RunLike[]) {
  const best: RunLike[] = [];
  const seen = new Set<string>();
  for (const r of [...runs].sort((a, b) => b.total - a.total)) {
    const key = r.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    best.push(r);
  }
  const rows: BoardRow[] = best.map((r, i) => ({
    rank: i + 1,
    handle: r.handle,
    character: r.character as Character,
    total: r.total,
  }));
  const ranks = new Map(best.map((r, i) => [r.email.toLowerCase(), i + 1]));
  const teams: TeamRow[] = CHARACTERS.map((character) => {
    const mine = best.filter((r) => r.character === character);
    return { character, players: mine.length, top: mine[0]?.total ?? 0 };
  });
  return { rows, teams, ranks };
}

const q = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** Entrants export for the admin: one row per player. */
export function entrantsCsv(runs: RunLike[]): string {
  const byEmail = new Map<string, { best: RunLike; runs: number; optIn: boolean }>();
  for (const r of runs) {
    const key = r.email.toLowerCase();
    const cur = byEmail.get(key);
    if (!cur) byEmail.set(key, { best: r, runs: 1, optIn: !!r.marketingOptIn });
    else {
      cur.runs++;
      cur.optIn ||= !!r.marketingOptIn;
      if (r.total > cur.best.total) cur.best = r;
    }
  }
  const lines = ["handle,email,character,best,runs,marketing_opt_in"];
  for (const { best, runs: count, optIn } of Array.from(byEmail.values()).sort((a, b) => b.best.total - a.best.total)) {
    lines.push(
      [q(best.handle), q(best.email.toLowerCase()), q(best.character), best.total, count, optIn ? "yes" : "no"].join(","),
    );
  }
  return lines.join("\n");
}
```

- [ ] **Step 4: Run gameBoard tests**

Run: `pnpm vitest run server/gameBoard.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Export `clientIp` from `server/_core/systemRouter.ts`**

Change line 9 from `function clientIp(` to `export function clientIp(`.

- [ ] **Step 6: Write the failing router test — `server/game.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.ADMIN_PASSWORD = "test-admin";
import type { TrpcContext } from "./_core/context";

vi.mock("./gameDb", () => ({
  getActiveEvent: vi.fn(),
  getCurrentEvent: vi.fn(),
  createRunToken: vi.fn().mockResolvedValue(undefined),
  getRunToken: vi.fn(),
  markRunTokenUsed: vi.fn().mockResolvedValue(true),
  insertRun: vi.fn().mockResolvedValue(undefined),
  getEventRuns: vi.fn().mockResolvedValue([]),
  listEventRunsForAdmin: vi.fn().mockResolvedValue([]),
  setRunRemoved: vi.fn().mockResolvedValue(undefined),
  startEvent: vi.fn().mockResolvedValue(undefined),
}));

import { appRouter } from "./routers";
import * as gameDb from "./gameDb";
import { resetGameRateLimits } from "./routers/game";
import { BENCH, DEADLIFT, SQUAT, TICK_MS } from "@shared/game/config";
import { LiftRunner } from "@shared/game/lift";
import { LIFT_SIMS, liftSeed } from "@shared/game/run";
import { idle, stepUntil, tap } from "@shared/game/testHelpers";
import type { BenchState } from "@shared/game/bench";

const db = vi.mocked(gameDb);
const RUN_ID = "3b241101-e2bb-4255-8caf-4136c566a962";
const SEED = 4242;
const EVENT = { id: 1, name: "Launch comp", startsAt: new Date(0), endsAt: new Date(Date.now() + 86_400_000), isActive: true, createdAt: new Date(0) };
const PLAY_MS = (BENCH.maxTicks + SQUAT.maxTicks + DEADLIFT.maxTicks) * TICK_MS;

function ctx(headers: Record<string, string> = {}): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers, ip: "1.2.3.4", url: "/api/trpc" } as unknown as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}
const publicCaller = () => appRouter.createCaller(ctx());
const adminCaller = () => appRouter.createCaller(ctx({ "x-admin-key": "test-admin" }));

function token(overrides: Partial<{ issuedAt: Date; usedAt: Date | null }> = {}) {
  return { id: RUN_ID, seed: SEED, character: "ruby", issuedAt: new Date(Date.now() - PLAY_MS - 5000), usedAt: null, ...overrides };
}

function perfectBenchLogs() {
  const b = new LiftRunner(LIFT_SIMS.bench, liftSeed(SEED, "bench"));
  stepUntil(b, (s: BenchState) => s.cooldown === 0 && Math.abs(s.pos - s.zoneCenter) < 0.01);
  tap(b);
  idle(b, 100_000);
  return { bench: b.events, squat: [], deadlift: [] };
}

const submission = (logs = perfectBenchLogs()) => ({
  runId: RUN_ID,
  handle: "@ruby.lifts",
  email: "Ruby@Example.com",
  marketingOptIn: true,
  logs,
});

beforeEach(() => {
  vi.clearAllMocks();
  resetGameRateLimits();
  db.getActiveEvent.mockResolvedValue(EVENT);
  db.getCurrentEvent.mockResolvedValue(EVENT);
  db.getRunToken.mockResolvedValue(token());
  db.markRunTokenUsed.mockResolvedValue(true);
  db.getEventRuns.mockResolvedValue([]);
});

describe("game.startRun", () => {
  it("issues a token with a seed and says whether the comp is open", async () => {
    const res = await publicCaller().game.startRun({ character: "benny" });
    expect(res.runId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.seed).toBeGreaterThanOrEqual(0);
    expect(res.eventOpen).toBe(true);
    expect(db.createRunToken).toHaveBeenCalledWith({ id: res.runId, seed: res.seed, character: "benny" });
  });
});

describe("game.submitRun", () => {
  it("re-scores the run server-side and saves it", async () => {
    db.getEventRuns.mockResolvedValue([
      { email: "ruby@example.com", handle: "ruby.lifts", character: "ruby", total: BENCH.perfectPoints } as never,
    ]);
    const res = await publicCaller().game.submitRun(submission());
    expect(res.total).toBe(BENCH.perfectPoints);
    expect(res.rank).toBe(1);
    expect(db.insertRun).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 1,
        handle: "ruby.lifts",
        email: "ruby@example.com",
        character: "ruby",
        benchScore: BENCH.perfectPoints,
        total: BENCH.perfectPoints,
        runTokenId: RUN_ID,
        marketingOptIn: true,
      }),
    );
  });

  it("rejects a token that was already used", async () => {
    db.getRunToken.mockResolvedValue(token({ usedAt: new Date() }));
    await expect(publicCaller().game.submitRun(submission())).rejects.toThrow(/didn't check out/);
    expect(db.insertRun).not.toHaveBeenCalled();
  });

  it("rejects a run submitted faster than it could be played", async () => {
    db.getRunToken.mockResolvedValue(token({ issuedAt: new Date() }));
    await expect(publicCaller().game.submitRun(submission())).rejects.toThrow(/didn't check out/);
  });

  it("rejects bot-speed mashing", async () => {
    const squat = Array.from({ length: 200 }, (_, i) => ({ tick: i, down: i % 2 === 0 }));
    await expect(
      publicCaller().game.submitRun(submission({ bench: [], squat, deadlift: [] })),
    ).rejects.toThrow(/didn't check out/);
  });

  it("refuses submissions when no comp is open", async () => {
    db.getActiveEvent.mockResolvedValue(null);
    await expect(publicCaller().game.submitRun(submission())).rejects.toThrow(/isn't open/);
  });

  it("rejects an invalid Instagram handle", async () => {
    await expect(publicCaller().game.submitRun({ ...submission(), handle: "not a handle!" })).rejects.toThrow();
  });

  it("rate-limits a single IP", async () => {
    for (let i = 0; i < 30; i++) await publicCaller().game.submitRun(submission());
    await expect(publicCaller().game.submitRun(submission())).rejects.toThrow(/too many runs/i);
  });
});

describe("game.leaderboard", () => {
  it("never exposes emails", async () => {
    db.getEventRuns.mockResolvedValue([
      { email: "secret@example.com", handle: "amy", character: "levi", total: 999 } as never,
    ]);
    const res = await publicCaller().game.leaderboard();
    expect(res.rows[0]).toEqual({ rank: 1, handle: "amy", character: "levi", total: 999 });
    expect(JSON.stringify(res)).not.toContain("secret@example.com");
  });

  it("returns an empty board when there's no event", async () => {
    db.getCurrentEvent.mockResolvedValue(null);
    const res = await publicCaller().game.leaderboard();
    expect(res.event).toBeNull();
    expect(res.rows).toEqual([]);
  });
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `pnpm vitest run server/game.test.ts`
Expected: FAIL — cannot resolve `./routers/game`.

- [ ] **Step 8: Implement `server/routers/game.ts`**

```ts
import { createHash, randomInt, randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { MAX_EVENTS_PER_LIFT } from "@shared/game/config";
import { CHARACTERS } from "@shared/game/types";
import { checkRun } from "@shared/game/validate";
import { clientIp } from "../_core/systemRouter";
import { publicProcedure, router } from "../_core/trpc";
import { buildBoard } from "../gameBoard";
import {
  createRunToken,
  getActiveEvent,
  getCurrentEvent,
  getEventRuns,
  getRunToken,
  insertRun,
  markRunTokenUsed,
} from "../gameDb";

const REJECTED = "That run didn't check out — run it back.";
const SUBMIT_LIMIT = 30;
const SUBMIT_WINDOW_MS = 60 * 60_000;
const submits = new Map<string, { count: number; until: number }>();

/** Counts a submission against `key`; true once the hourly limit is exceeded. */
function overLimit(key: string, now: number): boolean {
  const rec = submits.get(key);
  if (!rec || rec.until <= now) {
    submits.set(key, { count: 1, until: now + SUBMIT_WINDOW_MS });
    return false;
  }
  rec.count++;
  return rec.count > SUBMIT_LIMIT;
}

/** Test hook. */
export function resetGameRateLimits() {
  submits.clear();
}

const handleSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/^@/, ""))
  .pipe(z.string().regex(/^[A-Za-z0-9._]{1,30}$/, "Enter your Instagram handle"));

const logSchema = z
  .array(z.object({ tick: z.number().int().min(0).max(100_000), down: z.boolean() }))
  .max(MAX_EVENTS_PER_LIFT);

export const gameRouter = router({
  startRun: publicProcedure
    .input(z.object({ character: z.enum(CHARACTERS) }))
    .mutation(async ({ input }) => {
      const runId = randomUUID();
      const seed = randomInt(0, 2 ** 32);
      await createRunToken({ id: runId, seed, character: input.character });
      const event = await getActiveEvent();
      return { runId, seed, eventOpen: !!event };
    }),

  submitRun: publicProcedure
    .input(
      z.object({
        runId: z.string().uuid(),
        handle: handleSchema,
        email: z.string().trim().toLowerCase().email().max(320),
        marketingOptIn: z.boolean(),
        logs: z.object({ bench: logSchema, squat: logSchema, deadlift: logSchema }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const ip = clientIp(ctx.req);
      const ipLimited = overLimit(`ip:${ip}`, now);
      const emailLimited = overLimit(`email:${input.email}`, now);
      if (ipLimited || emailLimited) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Easy, champ — too many runs. Have a rest and try again in a bit." });
      }

      const event = await getActiveEvent();
      if (!event) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The comp isn't open right now — keep training for the next one." });
      }

      const token = await getRunToken(input.runId);
      if (!token || token.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: REJECTED });

      const check = checkRun(Number(token.seed), input.logs, now - token.issuedAt.getTime());
      if (!check.ok) {
        console.warn("[Game] rejected run", input.runId, check.reason);
        throw new TRPCError({ code: "BAD_REQUEST", message: REJECTED });
      }
      if (!(await markRunTokenUsed(token.id))) throw new TRPCError({ code: "BAD_REQUEST", message: REJECTED });

      await insertRun({
        eventId: event.id,
        handle: input.handle,
        email: input.email,
        marketingOptIn: input.marketingOptIn,
        character: token.character,
        benchScore: check.scores.bench,
        squatScore: check.scores.squat,
        deadliftScore: check.scores.deadlift,
        total: check.total,
        runTokenId: token.id,
        ipHash: createHash("sha256").update(`lff-gym:${ip}`).digest("hex"),
      });

      const board = buildBoard(await getEventRuns(event.id));
      return { total: check.total, scores: check.scores, rank: board.ranks.get(input.email) ?? null };
    }),

  leaderboard: publicProcedure.query(async () => {
    const event = await getCurrentEvent();
    if (!event) return { event: null, rows: [], teams: buildBoard([]).teams };
    const board = buildBoard(await getEventRuns(event.id));
    return {
      event: { name: event.name, startsAt: event.startsAt, endsAt: event.endsAt },
      rows: board.rows.slice(0, 20),
      teams: board.teams,
    };
  }),
});
```

- [ ] **Step 9: Mount the router in `server/routers.ts`**

Add the import after the `shopRouter` import:

```ts
import { gameRouter } from "./routers/game";
```

and add `game: gameRouter,` after `shop: shopRouter,` in `appRouter`.

- [ ] **Step 10: Run tests**

Run: `pnpm vitest run server/game.test.ts server/gameBoard.test.ts`
Expected: PASS. Then run the whole suite: `pnpm test` — Expected: all pass (existing tests unaffected).

- [ ] **Step 11: Type-check and commit**

Run: `pnpm check` — Expected: no errors.

```bash
git add server/gameBoard.ts server/gameBoard.test.ts server/routers/game.ts server/game.test.ts server/routers.ts server/_core/systemRouter.ts
git commit -m "feat(game): public game API with server-side re-scoring and leaderboard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Admin game API

**Files:**
- Modify: `server/routers/game.ts`
- Test: `server/game.test.ts` (append)

**Interfaces:**
- Consumes: `adminProcedure`, `listEventRunsForAdmin`, `setRunRemoved`, `startEvent`, `getCurrentEvent`, `entrantsCsv`.
- Produces: `game.admin.overview() → { event: GameEvent | null; runs: GameRun[] }`, `game.admin.setRunRemoved({ id, removed }) → { ok: true }`, `game.admin.startEvent({ name, startsAt, endsAt }) → { ok: true }`, `game.admin.entrantsCsv() → { csv: string }`.

- [ ] **Step 1: Append failing tests to `server/game.test.ts`**

```ts
describe("game.admin", () => {
  it("is locked to admins", async () => {
    await expect(publicCaller().game.admin.overview()).rejects.toThrow();
  });

  it("shows the current event's runs including emails", async () => {
    db.listEventRunsForAdmin.mockResolvedValue([{ id: 7, email: "a@x.com" } as never]);
    const res = await adminCaller().game.admin.overview();
    expect(res.event?.name).toBe("Launch comp");
    expect(res.runs).toHaveLength(1);
  });

  it("removes and restores a run", async () => {
    await adminCaller().game.admin.setRunRemoved({ id: 7, removed: true });
    expect(db.setRunRemoved).toHaveBeenCalledWith(7, true);
  });

  it("starts an event and refuses one that ends before it starts", async () => {
    const startsAt = new Date("2026-10-10T00:00:00Z");
    const endsAt = new Date("2026-10-24T00:00:00Z");
    await adminCaller().game.admin.startEvent({ name: "Tee drop comp", startsAt, endsAt });
    expect(db.startEvent).toHaveBeenCalledWith({ name: "Tee drop comp", startsAt, endsAt });
    await expect(
      adminCaller().game.admin.startEvent({ name: "Backwards", startsAt: endsAt, endsAt: startsAt }),
    ).rejects.toThrow();
  });

  it("exports entrants as CSV", async () => {
    db.getEventRuns.mockResolvedValue([
      { email: "a@x.com", handle: "amy", character: "ruby", total: 10, marketingOptIn: true } as never,
    ]);
    const { csv } = await adminCaller().game.admin.entrantsCsv();
    expect(csv).toContain('"amy","a@x.com","ruby",10,1,yes');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run server/game.test.ts`
Expected: FAIL — `game.admin` is undefined.

- [ ] **Step 3: Add the admin sub-router to `server/routers/game.ts`**

Update imports:

```ts
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { buildBoard, entrantsCsv } from "../gameBoard";
import {
  createRunToken,
  getActiveEvent,
  getCurrentEvent,
  getEventRuns,
  getRunToken,
  insertRun,
  listEventRunsForAdmin,
  markRunTokenUsed,
  setRunRemoved,
  startEvent,
} from "../gameDb";
```

Add inside `router({ ... })` after `leaderboard`:

```ts
  admin: router({
    overview: adminProcedure.query(async () => {
      const event = await getCurrentEvent();
      return { event, runs: event ? await listEventRunsForAdmin(event.id) : [] };
    }),

    setRunRemoved: adminProcedure
      .input(z.object({ id: z.number().int().positive(), removed: z.boolean() }))
      .mutation(async ({ input }) => {
        await setRunRemoved(input.id, input.removed);
        return { ok: true } as const;
      }),

    startEvent: adminProcedure
      .input(
        z
          .object({ name: z.string().trim().min(1).max(120), startsAt: z.coerce.date(), endsAt: z.coerce.date() })
          .refine((e) => e.endsAt > e.startsAt, { message: "End must be after start" }),
      )
      .mutation(async ({ input }) => {
        await startEvent(input);
        return { ok: true } as const;
      }),

    entrantsCsv: adminProcedure.query(async () => {
      const event = await getCurrentEvent();
      return { csv: entrantsCsv(event ? await getEventRuns(event.id) : []) };
    }),
  }),
```

- [ ] **Step 4: Run tests, type-check, commit**

Run: `pnpm vitest run server/game.test.ts` — Expected: PASS.
Run: `pnpm check` — Expected: no errors.

```bash
git add server/routers/game.ts server/game.test.ts
git commit -m "feat(game): admin endpoints for events, run moderation and entrant export

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Client content, sprites, audio, input

**Files:**
- Create: `client/src/game/content.ts`, `client/src/game/sprites.ts`, `client/src/game/audio.ts`, `client/src/game/input.ts`, `client/src/game/gold.ts`

**Interfaces:**
- Consumes: `Character`, `Outcome` (shared types).
- Produces:
  - content.ts: `CHARACTER_INFO: Record<Character, { name; tee: "black" | "cream" | "brown"; tagline; winQuotes: string[]; perfectQuotes: string[] }>`, `POPUPS: Record<Exclude<Outcome, null>, string[]>`, `LIFT_NAMES`, `LIFT_TIPS`, `TUT_LINE`, `WHOLE_FOODS_BRO`, `LEVI_REPLY_WHOLE_FOODS`, `BENNY_BANTER_REPLY`, `BENNY_3_PLATES_LOADING`, `BENNY_3_PLATES_DONE`, `RUBY_PODIUM_LINE`, `SHOP_CTA(character)`, `COACHING_CTA`, `IG_DM_URL`, `CHEAT_CODE`.
  - sprites.ts: `SPRITE_W = 16`, `SPRITE_H = 24`, `paletteFor(character, gold): Palette`, `drawSprite(ctx, character, gold, x, y, scale, opts?: { squash?: number; rotate?: boolean })`, `spriteDataUrl(character, gold, scale): string`, `drawMiniLevi(ctx, x, y, scale)`.
  - audio.ts: `sfx(kind: "perfect" | "good" | "miss" | "tut" | "start" | "done")`, `startMusic()`, `stopMusic()`, `isMuted()`, `setMuted(m)`.
  - input.ts: `attachInput(el: HTMLElement, onChange: (down: boolean) => void): () => void`.
  - gold.ts: `hasGold(): boolean`, `unlockGold(): void`.

- [ ] **Step 1: Create `client/src/game/content.ts`**

```ts
import type { Character, LiftId, Outcome } from "@shared/game/types";

export const IG_DM_URL = "https://ig.me/m/loverfighterfitness";
export const CHEAT_CODE = "TRANSFORM";

export const CHARACTER_INFO: Record<
  Character,
  { name: string; tee: "black" | "cream" | "brown"; tagline: string; winQuotes: string[]; perfectQuotes: string[] }
> = {
  levi: {
    name: "LEVI",
    tee: "black",
    tagline: "The coach. Science first.",
    winQuotes: ["Mark my words.", "That's the meta.", "Pretty damn good."],
    perfectQuotes: ["MECHANICAL TENSION ✓", "GOAT REP", "0 RIR"],
  },
  ruby: {
    name: "RUBY",
    tee: "cream",
    tagline: "2nd at her first ICN show.",
    winQuotes: ["Prep starts now.", "Stage-ready.", "Smashed it."],
    perfectQuotes: ["STAGE READY", "SMASHED IT", "INSANE"],
  },
  benny: {
    name: "BENNY",
    tee: "brown",
    tagline: "55. Old school. Chasing 3 plates.",
    winQuotes: ["YEAH BUDDY!", "Ain't nothin' but a peanut!", "LIGHT WEIGHT BABY!"],
    perfectQuotes: ["YEAH BUDDY!", "LIGHT WEIGHT!", "AIN'T NOTHIN' BUT A PEANUT!"],
  },
};

export const POPUPS: Record<Exclude<Outcome, null>, string[]> = {
  perfect: ["PERFECT", "GOAT REP", "INSANE"],
  good: ["GOOD REP", "SOLID", "NICE"],
  miss: ["MISSED", "FAILED REP", "RESET"],
  formbreak: ["FORM BREAK", "TOO FAST!", "CONTROL IT"],
  tut: ["TUT?!"],
};

export const LIFT_NAMES: Record<LiftId, string> = { bench: "BENCH PRESS", squat: "SQUATS", deadlift: "DEADLIFT" };

export const LIFT_TIPS: Record<LiftId, string> = {
  bench: "TAP when the marker hits the green. Dead centre = PERFECT.",
  squat: "TAP to drive up. Steady rhythm — mash too fast and your form breaks.",
  deadlift: "HOLD to pull. RELEASE in the green to lock out.",
};

export const TUT_LINE = "TUT doesn't grow muscle. Mechanical tension does.";
export const WHOLE_FOODS_BRO = "Just eat whole foods bro";
export const LEVI_REPLY_WHOLE_FOODS = "You can massively overeat on whole foods. Track it.";
export const BENNY_BANTER_REPLY = "...technically that's mechanical tension, Benny.";
export const BENNY_3_PLATES_LOADING = "55 YEARS YOUNG. 3 PLATES LOADING...";
export const BENNY_3_PLATES_DONE = "3 PLATES! LIGHT WEIGHT BABY!";
export const RUBY_PODIUM_LINE = "🥈 → 🥇";

export function SHOP_CTA(c: Character) {
  return `Rep the same ${CHARACTER_INFO[c].tee} tee as ${CHARACTER_INFO[c].name[0]}${CHARACTER_INFO[c].name.slice(1).toLowerCase()}`;
}
export const COACHING_CTA = "Want coaching built for you? DM me 'TRANSFORM'";
```

- [ ] **Step 2: Create `client/src/game/sprites.ts`**

```ts
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
 * Draw a lifter. `squash` (0..8 sprite px) bends the knees: the upper body drops while the feet stay planted.
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
  const img = spriteCanvas(c, gold);
  if (opts.rotate) {
    ctx.save();
    ctx.translate(x, y + SPRITE_W * scale);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(img, 0, 0, SPRITE_W * scale, SPRITE_H * scale);
    ctx.restore();
    return;
  }
  const squash = Math.round(opts.squash ?? 0);
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
```

- [ ] **Step 3: Create `client/src/game/audio.ts`**

```ts
/** Tiny WebAudio chiptune: no audio files to download. */
const MUTE_KEY = "lff-gym-muted";
let ctx: AudioContext | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (m) stopMusic();
}

function beep(freq: number, start: number, dur: number, type: OscillatorType = "square", vol = 0.06) {
  const a = ac();
  if (!a || isMuted()) return;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, a.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur + 0.02);
}

export function sfx(kind: "perfect" | "good" | "miss" | "tut" | "start" | "done") {
  switch (kind) {
    case "perfect":
      beep(880, 0, 0.08); beep(1320, 0.08, 0.12);
      break;
    case "good":
      beep(660, 0, 0.1);
      break;
    case "miss":
      beep(220, 0, 0.18, "sawtooth");
      break;
    case "tut":
      beep(330, 0, 0.12, "sawtooth"); beep(247, 0.14, 0.2, "sawtooth");
      break;
    case "start":
      beep(523, 0, 0.1); beep(659, 0.1, 0.1); beep(784, 0.2, 0.18);
      break;
    case "done":
      [523, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.12, 0.14));
      break;
  }
}

/** Looping 8-bar bassline + lead. */
const BASS = [110, 110, 131, 110, 147, 131, 110, 98];
const LEAD = [440, 0, 523, 440, 587, 523, 0, 392];

export function startMusic() {
  if (musicTimer || isMuted() || !ac()) return;
  let step = 0;
  musicTimer = setInterval(() => {
    const i = step % 8;
    beep(BASS[i], 0, 0.2, "triangle", 0.05);
    if (LEAD[i]) beep(LEAD[i], 0, 0.12, "square", 0.025);
    step++;
  }, 240);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
```

- [ ] **Step 4: Create `client/src/game/input.ts`**

```ts
/**
 * One input for the whole game: touch/mouse anywhere on `el`, or the spacebar.
 * Calls `onChange(true)` on press and `onChange(false)` on release.
 */
export function attachInput(el: HTMLElement, onChange: (down: boolean) => void): () => void {
  let pointers = 0;
  let key = false;
  let last = false;
  const emit = () => {
    const now = pointers > 0 || key;
    if (now !== last) {
      last = now;
      onChange(now);
    }
  };
  const down = (e: PointerEvent) => {
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    pointers++;
    emit();
  };
  const up = (e: PointerEvent) => {
    e.preventDefault();
    pointers = Math.max(0, pointers - 1);
    emit();
  };
  const keyDown = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (e.repeat) return;
    key = true;
    emit();
  };
  const keyUp = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    key = false;
    emit();
  };
  const blur = () => {
    pointers = 0;
    key = false;
    emit();
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", blur);
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", blur);
  };
}
```

- [ ] **Step 5: Create `client/src/game/gold.ts`**

```ts
const GOLD_KEY = "lff-gym-gold";

/** The TRANSFORM cheat code unlocks a cosmetic gold "Coached by Levi" tee. Per-device only. */
export function hasGold(): boolean {
  try {
    return localStorage.getItem(GOLD_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockGold() {
  try {
    localStorage.setItem(GOLD_KEY, "1");
  } catch {
    /* private mode — gold for this visit only */
  }
}
```

- [ ] **Step 6: Type-check and commit**

Run: `pnpm check` — Expected: no errors.

```bash
git add client/src/game
git commit -m "feat(game): LFF content, pixel sprites, chiptune audio and input

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Circuit sequencing, canvas renderer, and CircuitCanvas

**Files:**
- Create: `client/src/game/circuit.ts`, `client/src/game/render.ts`, `client/src/game/CircuitCanvas.tsx`
- Test: `server/circuit.test.ts` — `Circuit` lives client-side, but vitest only includes `server/**` and `shared/**`, and `@/` resolves to `client/src`, so the test lives under `server/`.

**Interfaces:**
- Consumes: `LiftRunner`, `LIFT_SIMS`, `liftSeed`, `TICK_MS`, types; sprites/audio/input/content from Task 9.
- Produces:
  - circuit.ts: `class Circuit { constructor(seed: number, character: Character); phase: CircuitPhase; current: LiftRunner<any> | null; setDown(down: boolean): void; tick(): void; logs(): RunLogs; scores(): LiftScores; perfects(): number; get done(): boolean }`, `type CircuitPhase = { kind: "intro"; lift: LiftId; ticksLeft: number; npc: boolean } | { kind: "lift"; lift: LiftId } | { kind: "done" }`, `INTRO_TICKS = 220`.
  - render.ts: `VIEW_W = 180`, `VIEW_H = 320`, `drawFrame(ctx, circuit, character, gold)`.
  - CircuitCanvas.tsx: `<CircuitCanvas seed character gold onFinish={(r: { logs: RunLogs; scores: LiftScores; perfects: number }) => void} />`.

- [ ] **Step 1: Create `client/src/game/circuit.ts`**

```ts
import { LiftRunner, type LiftSim, type LiftStateBase } from "@shared/game/lift";
import { LIFT_SIMS, liftSeed } from "@shared/game/run";
import { LIFTS, type Character, type LiftId, type LiftScores, type RunLogs } from "@shared/game/types";

export const INTRO_TICKS = 220;

export type CircuitPhase =
  | { kind: "intro"; lift: LiftId; ticksLeft: number; npc: boolean }
  | { kind: "lift"; lift: LiftId }
  | { kind: "done" };

/** Sequences intro → lift for bench, squat, deadlift. Input only reaches a lift while it's running. */
export class Circuit {
  phase: CircuitPhase = { kind: "intro", lift: "bench", ticksLeft: INTRO_TICKS, npc: false };
  current: LiftRunner<LiftStateBase> | null = null;
  private finished: Partial<Record<LiftId, LiftRunner<LiftStateBase>>> = {};

  constructor(private readonly seed: number, readonly character: Character) {}

  get done() {
    return this.phase.kind === "done";
  }

  setDown(down: boolean) {
    if (this.phase.kind === "lift") this.current?.setDown(down);
  }

  tick() {
    const p = this.phase;
    if (p.kind === "intro") {
      p.ticksLeft--;
      if (p.ticksLeft <= 0) {
        const sim: LiftSim<LiftStateBase> = LIFT_SIMS[p.lift];
        this.current = new LiftRunner(sim, liftSeed(this.seed, p.lift));
        this.phase = { kind: "lift", lift: p.lift };
      }
      return;
    }
    if (p.kind === "lift" && this.current) {
      this.current.advance();
      if (this.current.done) {
        this.finished[p.lift] = this.current;
        const next = LIFTS[LIFTS.indexOf(p.lift) + 1];
        this.phase = next
          ? { kind: "intro", lift: next, ticksLeft: INTRO_TICKS, npc: next === "deadlift" }
          : { kind: "done" };
      }
    }
  }

  logs(): RunLogs {
    return {
      bench: this.finished.bench?.events ?? [],
      squat: this.finished.squat?.events ?? [],
      deadlift: this.finished.deadlift?.events ?? [],
    };
  }

  scores(): LiftScores {
    return {
      bench: this.finished.bench?.state.score ?? 0,
      squat: this.finished.squat?.state.score ?? 0,
      deadlift: this.finished.deadlift?.state.score ?? 0,
    };
  }

  perfects(): number {
    return LIFTS.reduce((n, l) => n + (this.finished[l]?.state.perfects ?? 0), 0);
  }
}
```

- [ ] **Step 2: Write the circuit ↔ server agreement test — `server/circuit.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { Circuit } from "@/game/circuit";
import { replayRun } from "@shared/game/run";

describe("client Circuit", () => {
  it("produces logs that the server scores identically", () => {
    const c = new Circuit(777, "benny");
    let t = 0;
    while (!c.done && t < 20_000) {
      // A scrappy human: presses every 13 ticks, holds for 40 on the deadlift.
      if (t % 13 === 0) c.setDown(true);
      if (t % 13 === (c.phase.kind === "lift" && c.phase.lift === "deadlift" ? 12 : 2)) c.setDown(false);
      c.tick();
      t++;
    }
    expect(c.done).toBe(true);
    const server = replayRun(777, c.logs());
    expect(server.scores).toEqual(c.scores());
  });
});
```

- [ ] **Step 3: Run it**

Run: `pnpm vitest run server/circuit.test.ts`
Expected: PASS.

- [ ] **Step 4: Create `client/src/game/render.ts`**

```ts
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
```

- [ ] **Step 5: Create `client/src/game/CircuitCanvas.tsx`**

```tsx
import { TICK_MS } from "@shared/game/config";
import type { Character, LiftScores, RunLogs } from "@shared/game/types";
import { useEffect, useRef } from "react";
import { sfx } from "./audio";
import { Circuit } from "./circuit";
import { attachInput } from "./input";
import { drawFrame, VIEW_H, VIEW_W } from "./render";

export type CircuitResult = { logs: RunLogs; scores: LiftScores; perfects: number };

/** Runs the 3-lift circuit on a pixel canvas. Calls `onFinish` once with the input logs and live scores. */
export default function CircuitCanvas({
  seed,
  character,
  gold,
  onFinish,
}: {
  seed: number;
  character: Character;
  gold: boolean;
  onFinish: (r: CircuitResult) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const circuit = new Circuit(seed, character);
    const detach = attachInput(wrap, (down) => circuit.setDown(down));

    // Integer-scale the 180×320 view to fit the screen.
    const resize = () => {
      const s = Math.max(1, Math.floor(Math.min(window.innerWidth / VIEW_W, (window.innerHeight - 16) / VIEW_H)));
      canvas.style.width = `${VIEW_W * s}px`;
      canvas.style.height = `${VIEW_H * s}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let lastOutcomeKey = "";
    let finished = false;
    sfx("start");

    const frame = (now: number) => {
      acc += Math.min(250, now - last);
      last = now;
      while (acc >= TICK_MS && !circuit.done) {
        circuit.tick();
        acc -= TICK_MS;
      }
      const s = circuit.current?.state;
      if (s?.outcome) {
        const key = `${circuit.phase.kind === "lift" ? circuit.phase.lift : ""}:${s.outcomeTick}:${s.outcome}`;
        if (key !== lastOutcomeKey) {
          lastOutcomeKey = key;
          sfx(s.outcome === "formbreak" ? "miss" : s.outcome);
        }
      }
      drawFrame(ctx, circuit, character, gold);
      if (circuit.done && !finished) {
        finished = true;
        sfx("done");
        finishRef.current({ logs: circuit.logs(), scores: circuit.scores(), perfects: circuit.perfects() });
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      detach();
      window.removeEventListener("resize", resize);
    };
  }, [seed, character, gold]);

  return (
    <div
      ref={wrapRef}
      className="flex min-h-screen items-center justify-center select-none"
      style={{ touchAction: "none", backgroundColor: "#2e2318", WebkitUserSelect: "none" }}
    >
      <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
```

- [ ] **Step 6: Type-check, test, commit**

Run: `pnpm check && pnpm test` — Expected: no type errors, all tests pass.

```bash
git add client/src/game server/circuit.test.ts
git commit -m "feat(game): circuit sequencing, pixel renderer and game canvas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Game screens and the `/game` page

**Files:**
- Create: `client/src/game/screens/TitleScreen.tsx`, `client/src/game/screens/SelectScreen.tsx`, `client/src/game/screens/ResultsScreen.tsx`, `client/src/game/screens/Leaderboard.tsx`, `client/src/game/screens/ui.tsx`, `client/src/pages/Game.tsx`
- Modify: `client/src/App.tsx` (lazy route)

**Interfaces:**
- Consumes: `trpc.game.startRun`, `trpc.game.submitRun`, `trpc.game.leaderboard`; `CircuitCanvas`, `CircuitResult`; content, sprites, audio, gold.
- Produces: route `/game`.

- [ ] **Step 1: Create shared UI bits — `client/src/game/screens/ui.tsx`**

```tsx
import type { ReactNode } from "react";

export const PIXEL_FONT = '"Press Start 2P", monospace';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-8 gap-6"
      style={{ backgroundColor: "#54412F", color: "#EAE6D2", fontFamily: PIXEL_FONT }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6">{children}</div>
    </div>
  );
}

export function PixelButton({
  children,
  onClick,
  disabled,
  variant = "cream",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "cream" | "ghost";
  type?: "button" | "submit";
}) {
  const cream = variant === "cream";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full px-4 py-3 text-xs disabled:opacity-50 active:translate-y-0.5"
      style={{
        fontFamily: PIXEL_FONT,
        backgroundColor: cream ? "#EAE6D2" : "transparent",
        color: cream ? "#54412F" : "#EAE6D2",
        border: "3px solid #EAE6D2",
        boxShadow: cream ? "4px 4px 0 #2e2318" : "none",
      }}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create `client/src/game/screens/TitleScreen.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CHEAT_CODE } from "../content";
import { hasGold, unlockGold } from "../gold";
import { isMuted, setMuted } from "../audio";
import { PixelButton, Screen } from "./ui";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

export default function TitleScreen({ onPlay, onBoard }: { onPlay: () => void; onBoard: () => void }) {
  const [muted, setMutedState] = useState(isMuted());
  const typed = useRef("");
  const logoTaps = useRef(0);

  const tryUnlock = (code: string) => {
    if (code.toUpperCase() !== CHEAT_CODE) return false;
    if (!hasGold()) unlockGold();
    toast.success("GOLD UNLOCKED — Coached by Levi 🤎");
    return true;
  };

  // Desktop: type TRANSFORM anywhere on the title screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      typed.current = (typed.current + e.key.toUpperCase()).slice(-CHEAT_CODE.length);
      if (typed.current === CHEAT_CODE) tryUnlock(typed.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Phones: tap the logo 5 times to enter a code.
  const tapLogo = () => {
    logoTaps.current++;
    if (logoTaps.current < 5) return;
    logoTaps.current = 0;
    const code = window.prompt("Enter code");
    if (code && !tryUnlock(code.trim())) toast("Nope. Coaching's the only cheat code.");
  };

  return (
    <Screen>
      <img
        src={LOGO}
        alt="LFF"
        onClick={tapLogo}
        className="w-40 mt-6"
        style={{ imageRendering: "pixelated", filter: "contrast(1.2)" }}
      />
      <h1 className="text-xl text-center leading-relaxed">LFF GYM</h1>
      <p className="text-[10px] text-center leading-loose opacity-80">
        Bench. Squat. Deadlift. One circuit.
        <br />
        Top score wins a free LFF tee.
      </p>
      <PixelButton onClick={onPlay}>PRESS START</PixelButton>
      <PixelButton variant="ghost" onClick={onBoard}>
        LEADERBOARD
      </PixelButton>
      <button
        className="text-[10px] opacity-70 underline"
        onClick={() => {
          setMuted(!muted);
          setMutedState(!muted);
        }}
      >
        SOUND: {muted ? "OFF" : "ON"}
      </button>
    </Screen>
  );
}
```

- [ ] **Step 3: Create `client/src/game/screens/SelectScreen.tsx`**

```tsx
import { CHARACTERS, type Character } from "@shared/game/types";
import { useMemo, useState } from "react";
import { CHARACTER_INFO } from "../content";
import { hasGold } from "../gold";
import { spriteDataUrl } from "../sprites";
import { PixelButton, Screen } from "./ui";

export default function SelectScreen({
  onPick,
  onBack,
  starting,
}: {
  onPick: (c: Character, gold: boolean) => void;
  onBack: () => void;
  starting: boolean;
}) {
  const goldUnlocked = hasGold();
  const [gold, setGold] = useState(goldUnlocked);
  const [picked, setPicked] = useState<Character>("levi");
  const sprites = useMemo(
    () => Object.fromEntries(CHARACTERS.map((c) => [c, spriteDataUrl(c, gold, 4)])) as Record<Character, string>,
    [gold],
  );

  return (
    <Screen>
      <h2 className="text-sm mt-4">CHOOSE YOUR LIFTER</h2>
      <div className="grid grid-cols-2 gap-3 w-full">
        {CHARACTERS.map((c) => (
          <button
            key={c}
            onClick={() => setPicked(c)}
            className="flex flex-col items-center gap-2 p-3"
            style={{ border: `3px solid ${picked === c ? "#d4af37" : "#EAE6D2"}`, backgroundColor: picked === c ? "#2e2318" : "transparent" }}
          >
            <img src={sprites[c]} alt={CHARACTER_INFO[c].name} width={64} height={96} style={{ imageRendering: "pixelated" }} />
            <span className="text-[10px]">{CHARACTER_INFO[c].name}</span>
            <span className="text-[7px] leading-relaxed opacity-75 text-center">{CHARACTER_INFO[c].tagline}</span>
          </button>
        ))}
        <div className="flex flex-col items-center justify-center gap-2 p-3 opacity-50" style={{ border: "3px dashed #EAE6D2" }}>
          <span className="text-2xl">?</span>
          <span className="text-[10px]">???</span>
          <span className="text-[7px]">COMING SOON</span>
        </div>
      </div>
      {goldUnlocked && (
        <label className="flex items-center gap-2 text-[9px]">
          <input type="checkbox" checked={gold} onChange={(e) => setGold(e.target.checked)} />
          GOLD "COACHED BY LEVI" TEE
        </label>
      )}
      <p className="text-[8px] opacity-70 text-center leading-loose">Same lifts, same rules — pick your team.</p>
      <PixelButton onClick={() => onPick(picked, gold)} disabled={starting}>
        {starting ? "LOADING PLATES..." : `LIFT AS ${CHARACTER_INFO[picked].name}`}
      </PixelButton>
      <PixelButton variant="ghost" onClick={onBack}>
        BACK
      </PixelButton>
    </Screen>
  );
}
```

- [ ] **Step 4: Create `client/src/game/screens/Leaderboard.tsx`**

```tsx
import type { Character } from "@shared/game/types";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { CHARACTER_INFO } from "../content";
import { spriteDataUrl } from "../sprites";

function timeLeft(endsAt: Date) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "COMP CLOSED";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d}D ${h}H LEFT` : `${h}H LEFT`;
}

/** Live board — refreshes every 10s while on screen. */
export default function Leaderboard({ highlightHandle }: { highlightHandle?: string }) {
  const { data, isLoading, error } = trpc.game.leaderboard.useQuery(undefined, { refetchInterval: 10_000 });
  const icons = useMemo(
    () => Object.fromEntries((["levi", "ruby", "benny"] as Character[]).map((c) => [c, spriteDataUrl(c, false, 1)])),
    [],
  );

  if (isLoading) return <p className="text-[10px]">LOADING BOARD...</p>;
  if (error || !data) return <p className="text-[10px] text-center">Board's offline right now. Try again soon.</p>;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center">
        <p className="text-xs" style={{ color: "#d4af37" }}>{data.event?.name ?? "NEXT COMP COMING SOON"}</p>
        {data.event && <p className="text-[8px] mt-2 opacity-75">{timeLeft(data.event.endsAt)} · TOP SCORE WINS A TEE</p>}
      </div>
      <ol className="w-full flex flex-col gap-1">
        {data.rows.length === 0 && <li className="text-[9px] text-center opacity-75">No scores yet. Be first.</li>}
        {data.rows.map((r) => (
          <li
            key={r.rank}
            className="flex items-center gap-2 px-2 py-1.5 text-[9px]"
            style={{
              backgroundColor: r.handle === highlightHandle ? "#d4af37" : r.rank === 1 ? "#2e2318" : "transparent",
              color: r.handle === highlightHandle ? "#2e2318" : undefined,
            }}
          >
            <span className="w-6 text-right">{r.rank}</span>
            <img src={icons[r.character]} alt="" width={16} height={24} style={{ imageRendering: "pixelated" }} />
            <span className="flex-1 truncate">@{r.handle}</span>
            <span>{r.total}</span>
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-3 gap-2 text-center">
        {data.teams.map((t) => (
          <div key={t.character} className="p-2" style={{ border: "2px solid #EAE6D2" }}>
            <p className="text-[8px]">TEAM {CHARACTER_INFO[t.character].name}</p>
            <p className="text-[10px] mt-2">{t.top}</p>
            <p className="text-[7px] mt-1 opacity-75">{t.players} LIFTERS</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `client/src/game/screens/ResultsScreen.tsx`**

```tsx
import type { Character } from "@shared/game/types";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { CircuitResult } from "../CircuitCanvas";
import { CHARACTER_INFO, COACHING_CTA, IG_DM_URL, RUBY_PODIUM_LINE, SHOP_CTA } from "../content";
import { PixelButton, Screen } from "./ui";

const SAVED_KEY = "lff-gym-entrant";

function loadSaved(): { handle: string; email: string } {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "") as { handle: string; email: string };
  } catch {
    return { handle: "", email: "" };
  }
}

export default function ResultsScreen({
  character,
  runId,
  eventOpen,
  result,
  onAgain,
  onPosted,
}: {
  character: Character;
  runId: string | null;
  eventOpen: boolean;
  result: CircuitResult;
  onAgain: () => void;
  onPosted: (handle: string) => void;
}) {
  const saved = loadSaved();
  const [handle, setHandle] = useState(saved.handle);
  const [email, setEmail] = useState(saved.email);
  const [optIn, setOptIn] = useState(true);
  const [error, setError] = useState("");
  const submit = trpc.game.submitRun.useMutation();
  const total = result.scores.bench + result.scores.squat + result.scores.deadlift;
  const info = CHARACTER_INFO[character];
  const quote = info.winQuotes[total % info.winQuotes.length];

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runId) return;
    setError("");
    try {
      await submit.mutateAsync({ runId, handle, email, marketingOptIn: optIn, logs: result.logs });
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify({ handle, email }));
      } catch {
        /* ignore */
      }
      onPosted(handle.trim().replace(/^@/, ""));
    } catch (err) {
      // Network failures keep the run here so the player can retry.
      setError(err instanceof Error ? err.message : "Couldn't post your score. Try again.");
    }
  };

  const canPost = !!runId && eventOpen;

  return (
    <Screen>
      <h2 className="text-sm mt-4" style={{ color: "#d4af37" }}>CIRCUIT COMPLETE</h2>
      <p className="text-[10px] text-center leading-loose">"{quote}" — {info.name}</p>
      {character === "ruby" && result.perfects >= 8 && <p className="text-lg">{RUBY_PODIUM_LINE}</p>}
      <div className="w-full flex flex-col gap-2 text-[10px]">
        <div className="flex justify-between"><span>BENCH</span><span>{result.scores.bench}</span></div>
        <div className="flex justify-between"><span>SQUATS</span><span>{result.scores.squat}</span></div>
        <div className="flex justify-between"><span>DEADLIFT</span><span>{result.scores.deadlift}</span></div>
        <div className="flex justify-between text-sm pt-2" style={{ borderTop: "2px solid #EAE6D2" }}>
          <span>TOTAL</span><span>{total}</span>
        </div>
      </div>

      {canPost ? (
        <form onSubmit={post} className="w-full flex flex-col gap-3 text-[9px]">
          <p className="leading-loose">Post your score. Top score when the comp closes wins a free tee.</p>
          <input
            required
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@instagram"
            className="w-full px-3 py-3 text-[10px]"
            style={{ backgroundColor: "#2e2318", color: "#EAE6D2", border: "2px solid #EAE6D2", fontFamily: "inherit" }}
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email (private — only to contact the winner)"
            className="w-full px-3 py-3 text-[10px]"
            style={{ backgroundColor: "#2e2318", color: "#EAE6D2", border: "2px solid #EAE6D2", fontFamily: "inherit" }}
          />
          <label className="flex items-start gap-2 leading-relaxed">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
            Send me LFF training tips and drops
          </label>
          {error && <p style={{ color: "#ff8a7a" }} className="leading-relaxed">{error}</p>}
          <PixelButton type="submit" disabled={submit.isPending}>
            {submit.isPending ? "POSTING..." : error ? "RETRY" : "POST SCORE"}
          </PixelButton>
        </form>
      ) : (
        <p className="text-[9px] text-center leading-loose opacity-80">
          {runId ? "The comp isn't open right now — this one's for practice." : "Practice run — scores can't be posted right now."}
        </p>
      )}

      <PixelButton variant={canPost ? "ghost" : "cream"} onClick={onAgain}>RUN IT BACK</PixelButton>
      <a href="/shop" className="text-[9px] underline text-center leading-loose">{SHOP_CTA(character)} →</a>
      <a href={IG_DM_URL} target="_blank" rel="noreferrer" className="text-[9px] underline text-center leading-loose">
        {COACHING_CTA}
      </a>
    </Screen>
  );
}
```

- [ ] **Step 6: Create `client/src/pages/Game.tsx`**

```tsx
import type { Character } from "@shared/game/types";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { startMusic, stopMusic } from "@/game/audio";
import CircuitCanvas, { type CircuitResult } from "@/game/CircuitCanvas";
import Leaderboard from "@/game/screens/Leaderboard";
import ResultsScreen from "@/game/screens/ResultsScreen";
import SelectScreen from "@/game/screens/SelectScreen";
import TitleScreen from "@/game/screens/TitleScreen";
import { PixelButton, Screen } from "@/game/screens/ui";

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

type Run = { character: Character; gold: boolean; seed: number; runId: string | null; eventOpen: boolean };
type View =
  | { name: "title" }
  | { name: "select" }
  | { name: "play"; run: Run }
  | { name: "results"; run: Run; result: CircuitResult }
  | { name: "board"; highlight?: string };

export default function Game() {
  const [view, setView] = useState<View>({ name: "title" });
  const startRun = trpc.game.startRun.useMutation();

  // Pixel font only loads on /game.
  useEffect(() => {
    document.title = "LFF Gym — win a free tee";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    return () => {
      link.remove();
      stopMusic();
    };
  }, []);

  const begin = async (character: Character, gold: boolean) => {
    startMusic();
    try {
      const res = await startRun.mutateAsync({ character });
      setView({ name: "play", run: { character, gold, seed: res.seed, runId: res.runId, eventOpen: res.eventOpen } });
    } catch {
      // Server down: still playable as a practice run.
      const seed = Math.floor(Math.random() * 2 ** 32);
      setView({ name: "play", run: { character, gold, seed, runId: null, eventOpen: false } });
    }
  };

  switch (view.name) {
    case "title":
      return <TitleScreen onPlay={() => setView({ name: "select" })} onBoard={() => setView({ name: "board" })} />;
    case "select":
      return <SelectScreen onPick={begin} onBack={() => setView({ name: "title" })} starting={startRun.isPending} />;
    case "play":
      return (
        <CircuitCanvas
          key={view.run.seed}
          seed={view.run.seed}
          character={view.run.character}
          gold={view.run.gold}
          onFinish={(result) => setView({ name: "results", run: view.run, result })}
        />
      );
    case "results":
      return (
        <ResultsScreen
          character={view.run.character}
          runId={view.run.runId}
          eventOpen={view.run.eventOpen}
          result={view.result}
          onAgain={() => begin(view.run.character, view.run.gold)}
          onPosted={(handle) => setView({ name: "board", highlight: handle })}
        />
      );
    case "board":
      return (
        <Screen>
          <h2 className="text-sm mt-4">LEADERBOARD</h2>
          <Leaderboard highlightHandle={view.highlight} />
          <PixelButton onClick={() => setView({ name: "select" })}>{view.highlight ? "RUN IT BACK" : "PLAY"}</PixelButton>
          <PixelButton variant="ghost" onClick={() => setView({ name: "title" })}>TITLE</PixelButton>
        </Screen>
      );
  }
}
```

- [ ] **Step 7: Add the route in `client/src/App.tsx`**

After `const Program = lazy(() => import("./pages/Program"));` add:

```tsx
const Game = lazy(() => import("./pages/Game"));
```

After `<Route path={"/program"} component={Program} />` add:

```tsx
      <Route path={"/game"} component={Game} />
```

- [ ] **Step 8: Type-check, test, commit**

Run: `pnpm check && pnpm test` — Expected: clean.

```bash
git add client/src/game client/src/pages/Game.tsx client/src/App.tsx
git commit -m "feat(game): title, character select, results and live leaderboard at /game

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Admin "Game" tab

**Files:**
- Create: `client/src/components/GameTab.tsx`
- Modify: `client/src/pages/AdminLeads.tsx` (tab union at line ~406, tab list + labels at ~543, render at ~619)

**Interfaces:**
- Consumes: `trpc.game.admin.overview`, `.setRunRemoved`, `.startEvent`, `.entrantsCsv`.

- [ ] **Step 1: Create `client/src/components/GameTab.tsx`**

```tsx
/**
 * Game Tab — run the LFF Gym comp: set the event window, moderate scores, export entrants.
 */
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const CREAM = "#EAE6D2";
const muted = { color: "rgba(234,230,210,0.72)" };
const inputStyle = { backgroundColor: "rgba(0,0,0,0.25)", color: CREAM, border: "1px solid rgba(234,230,210,0.3)" };

export default function GameTab() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.game.admin.overview.useQuery();
  const setRemoved = trpc.game.admin.setRunRemoved.useMutation({
    onSuccess: () => utils.game.admin.overview.invalidate(),
  });
  const startEvent = trpc.game.admin.startEvent.useMutation({
    onSuccess: () => {
      toast.success("Comp started");
      utils.game.admin.overview.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const [name, setName] = useState("LFF Gym launch comp");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const exportCsv = async () => {
    const { csv } = await utils.game.admin.entrantsCsv.fetch();
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `lff-gym-entrants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={28} style={{ color: CREAM }} /></div>;
  if (error) return <p className="text-sm py-10 text-center" style={muted}>Couldn't load the game: {error.message}</p>;

  const event = data?.event;
  const runs = data?.runs ?? [];

  return (
    <div className="flex flex-col gap-6" style={{ color: CREAM }}>
      <section className="rounded-xl p-4" style={{ backgroundColor: "rgba(0,0,0,0.18)" }}>
        <h3 className="font-bold mb-1">Current comp</h3>
        {event ? (
          <p className="text-sm" style={muted}>
            {event.name} · {new Date(event.startsAt).toLocaleString()} → {new Date(event.endsAt).toLocaleString()}
          </p>
        ) : (
          <p className="text-sm" style={muted}>No comp set. The game still works as practice until you start one.</p>
        )}
        <a href="/game" target="_blank" rel="noreferrer" className="text-xs underline mt-2 inline-block">Open /game</a>
      </section>

      <form
        className="rounded-xl p-4 grid gap-3 sm:grid-cols-4 items-end"
        style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
        onSubmit={(e) => {
          e.preventDefault();
          startEvent.mutate({ name, startsAt: new Date(startsAt), endsAt: new Date(endsAt) });
        }}
      >
        <label className="text-xs flex flex-col gap-1 sm:col-span-2">Name
          <input className="rounded px-2 py-1.5 text-sm" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="text-xs flex flex-col gap-1">Starts
          <input type="datetime-local" className="rounded px-2 py-1.5 text-sm" style={inputStyle} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </label>
        <label className="text-xs flex flex-col gap-1">Ends
          <input type="datetime-local" className="rounded px-2 py-1.5 text-sm" style={inputStyle} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
        </label>
        <button type="submit" disabled={startEvent.isPending} className="sm:col-span-4 rounded-lg py-2 text-sm font-bold" style={{ backgroundColor: CREAM, color: "#54412F" }}>
          {event ? "Start a new comp (resets the board)" : "Start comp"}
        </button>
      </form>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Runs ({runs.length})</h3>
          <button onClick={exportCsv} className="text-xs flex items-center gap-1 underline"><Download size={14} /> Export entrants CSV</button>
        </div>
        {runs.length === 0 ? (
          <p className="text-sm py-6 text-center" style={muted}>No runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead style={muted}>
                <tr className="text-left">
                  <th className="py-1 pr-2">Handle</th><th className="pr-2">Email</th><th className="pr-2">Lifter</th>
                  <th className="pr-2 text-right">Bench</th><th className="pr-2 text-right">Squat</th><th className="pr-2 text-right">DL</th>
                  <th className="pr-2 text-right">Total</th><th className="pr-2">When</th><th />
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} style={{ opacity: r.removed ? 0.4 : 1, borderTop: "1px solid rgba(234,230,210,0.12)" }}>
                    <td className="py-1.5 pr-2">@{r.handle}</td>
                    <td className="pr-2">{r.email}{r.marketingOptIn ? " ✓" : ""}</td>
                    <td className="pr-2 capitalize">{r.character}</td>
                    <td className="pr-2 text-right">{r.benchScore}</td>
                    <td className="pr-2 text-right">{r.squatScore}</td>
                    <td className="pr-2 text-right">{r.deadliftScore}</td>
                    <td className="pr-2 text-right font-bold">{r.total}</td>
                    <td className="pr-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="underline" onClick={() => setRemoved.mutate({ id: r.id, removed: !r.removed })}>
                        {r.removed ? "Restore" : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Wire the tab into `client/src/pages/AdminLeads.tsx`**

1. Add the import next to the other tab imports: `import GameTab from "@/components/GameTab";`
2. In the `activeTab` `useState` union (line ~406) add `| "game"`:
   `useState<"analytics" | "enquiries" | "leads" | "sms" | "referrals" | "orders" | "inventory" | "game">("analytics")`
3. In the tab list array (line ~543) append `"game"`: `(["analytics", "enquiries", "leads", "sms", "referrals", "orders", "inventory", "game"] as const)`
4. In `tabLabels` add `game: "Game",`
5. After `{activeTab === "referrals" && <ReferralsTab />}` (line ~621) add `{activeTab === "game" && <GameTab />}`

- [ ] **Step 3: Type-check, test, commit**

Run: `pnpm check && pnpm test` — Expected: clean.

```bash
git add client/src/components/GameTab.tsx client/src/pages/AdminLeads.tsx
git commit -m "feat(game): admin Game tab for comp dates, moderation and entrant export

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Browser verification (offline, no production DB)

**Files:**
- Modify: `.claude/launch.json` (add an offline config)

- [ ] **Step 1: Add an offline dev config**

Add this entry to `configurations` in `.claude/launch.json` (empty `DATABASE_URL` overrides `.env`, so nothing touches production):

```json
    {
      "name": "lff-game-offline",
      "runtimeExecutable": "/bin/sh",
      "runtimeArgs": ["-c", "DATABASE_URL= /Users/levihurst/Library/pnpm/pnpm dev"],
      "port": 3000,
      "autoPort": true
    }
```

- [ ] **Step 2: Start it and open `/game`**

Use `preview_start` with `{ name: "lff-game-offline" }`, then navigate to `/game`. Expected: title screen in the pixel font, LFF logo, PRESS START / LEADERBOARD.

- [ ] **Step 3: Check every screen at phone width**

`resize_window` preset `mobile`. Verify, with screenshots:
- Title → Select shows Levi (black tee), Ruby (cream tee, long hair), Benny (brown tee, grey beard) and a locked "???" tile.
- Select → LIFT AS LEVI → `startRun` fails (no DB) → practice run starts (intro countdown "BENCH PRESS").
- Bench: marker sweeps, tapping the canvas registers reps; misses show red pips; 3 misses ends it.
- Squats: tapping drives the bar; mashing turns the form meter red and shows FORM BREAK; leaving a rep half-done shows the TUT pixel-Levi line.
- Deadlift intro shows the "whole foods bro" exchange; holding fills the gauge; releasing in green locks out and adds weight.
- Results: totals add up; shows "Practice run — scores can't be posted right now"; shop + DM links present.
- Leaderboard view: shows "Board's offline right now" (no DB) without crashing.
- Desktop (`resize_window` preset `desktop`): spacebar plays; typing TRANSFORM on title shows the gold toast and a gold tee option on Select.
- No console errors (`read_console_messages` with `onlyErrors: true`), and `/shop` + `/` still render.

- [ ] **Step 4: Fix anything found, re-run `pnpm check && pnpm test`, then commit**

```bash
git add .claude/launch.json
git commit -m "chore(game): offline dev config for safe local playtesting

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Then `resize_window` preset `desktop` to reset the viewport.

---

### Task 14: Go-live (requires Levi's explicit approval at each step — do not run unprompted)

These touch production. Ask Levi before each.

- [ ] **Step 1: Apply the migration to the production DB** — check `__drizzle_migrations` row count matches the journal entries before 0012 (read-only query). If in sync, run `pnpm drizzle-kit migrate`; if not, run only the statements in `drizzle/0012_lff_gym_game.sql` against the DB.
- [ ] **Step 2: Merge `feature/lff-gym-game` and let Railway deploy.**
- [ ] **Step 3: In `/admin/leads` → Game, start the two-week comp.**
- [ ] **Step 4: Play one real run on a phone at `/game`, post a score, confirm it appears on the board and in the admin tab; remove it if it was a test.**
