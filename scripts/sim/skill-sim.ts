/**
 * Balance check: plays the circuit with simulated humans of different skill (timing noise) and
 * prints the spread of totals. Run: npx tsx scripts/sim/skill-sim.ts
 */
import { DEADLIFT_CENTRE } from "../../shared/game/deadlift";
import { DEADLIFT, SQUAT } from "../../shared/game/config";
import { LiftRunner, type LiftStateBase } from "../../shared/game/lift";
import { LIFT_SIMS, liftSeed } from "../../shared/game/run";
import type { BenchState } from "../../shared/game/bench";
import type { DeadliftState } from "../../shared/game/deadlift";
import type { SquatState } from "../../shared/game/squat";

type Skill = { name: string; sigma: number; tapMu: number; tapSd: number };
const SKILLS: Skill[] = [
  { name: "elite", sigma: 1.2, tapMu: 8, tapSd: 0.7 },
  { name: "strong", sigma: 2.5, tapMu: 9, tapSd: 1.3 },
  { name: "average", sigma: 4, tapMu: 10.5, tapSd: 2.2 },
  { name: "casual", sigma: 7, tapMu: 10, tapSd: 3.5 },
];

let rs = 1;
const rnd = () => ((rs = (Math.imul(rs, 1103515245) + 12345) >>> 0) / 2 ** 32);
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

function press<S extends LiftStateBase>(r: LiftRunner<S>, hold = 6) {
  r.setDown(true);
  for (let i = 0; i < hold && !r.done; i++) r.advance();
  r.setDown(false);
}

function playBench(seed: number, k: Skill) {
  const r = new LiftRunner(LIFT_SIMS.bench, seed);
  const s = r.state as BenchState;
  while (!r.done) {
    if (s.cooldown > 0) { r.advance(); continue; }
    // Predict when the marker next crosses the zone centre (at least 15 ticks ahead), aim there.
    let pos = s.pos, dir = s.dir, t = 0, hit = -1;
    for (; t < 2000; t++) {
      const prev = pos;
      pos += s.speed * dir;
      if (pos >= 1) { pos = 2 - pos; dir = -1; } else if (pos <= 0) { pos = -pos; dir = 1; }
      if (t >= 15 && (prev - s.zoneCenter) * (pos - s.zoneCenter) <= 0) { hit = t; break; }
    }
    const wait = Math.max(0, Math.round(hit + gauss() * k.sigma));
    for (let i = 0; i < wait && !r.done; i++) r.advance();
    if (!r.done) press(r, 4);
  }
  secs += s.tick / 100;
  return s.score;
}

function playSquat(seed: number, k: Skill) {
  const r = new LiftRunner(LIFT_SIMS.squat, seed);
  const s = r.state as SquatState;
  while (!r.done) {
    if (s.cooldown > 0) { r.advance(); continue; }
    press(r, 3);
    const gap = Math.max(5, Math.round(k.tapMu + gauss() * k.tapSd)) - 3;
    for (let i = 0; i < gap && !r.done; i++) r.advance();
  }
  secs += s.tick / 100;
  return s.score;
}

function playDeadlift(seed: number, k: Skill) {
  const r = new LiftRunner(LIFT_SIMS.deadlift, seed);
  const s = r.state as DeadliftState;
  while (!r.done) {
    if (s.cooldown > 0 || s.needRelease) { r.advance(); continue; }
    const rate = DEADLIFT.gaugeRateStart + DEADLIFT.gaugeRateStep * (s as any).attempt;
    const hold = Math.max(2, Math.round(DEADLIFT_CENTRE / rate + gauss() * k.sigma));
    for (let i = 0; i < 10 && !r.done; i++) r.advance(); // reaction before pulling
    r.setDown(true);
    for (let i = 0; i < hold && !r.done; i++) r.advance();
    r.setDown(false);
    for (let i = 0; i < 3 && !r.done; i++) r.advance();
  }
  secs += s.tick / 100;
  return s.score;
}

let secs = 0;
const N = Number(process.argv[2] ?? 300);
const pct = (a: number[], p: number) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
for (const k of SKILLS) {
  secs = 0;
  const totals: number[] = [], b: number[] = [], sq: number[] = [], dl: number[] = [];
  for (let i = 0; i < N; i++) {
    const seed = (i * 2654435761) >>> 0;
    const x = playBench(liftSeed(seed, "bench"), k), y = playSquat(liftSeed(seed, "squat"), k), z = playDeadlift(liftSeed(seed, "deadlift"), k);
    b.push(x); sq.push(y); dl.push(z); totals.push(x + y + z);
  }
  for (const a of [totals, b, sq, dl]) a.sort((m, n) => m - n);
  const top = totals[totals.length - 1];
  const atTop = totals.filter((t) => t === top).length;
  const distinct = new Set(totals).size;
  console.log(
    `${k.name.padEnd(8)} total p10 ${pct(totals, 0.1)} p50 ${pct(totals, 0.5)} p90 ${pct(totals, 0.9)} max ${top} (${atTop} tied at max, ${distinct} distinct)` +
      ` | ~${Math.round(secs / N)}s/run | bench p50 ${pct(b, 0.5)} max ${b[b.length - 1]} | squat p50 ${pct(sq, 0.5)} max ${sq[sq.length - 1]} | dl p50 ${pct(dl, 0.5)} max ${dl[dl.length - 1]}`,
  );
}
