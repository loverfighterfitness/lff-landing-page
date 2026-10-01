import { LiftRunner, type LiftSim, type LiftStateBase } from "@shared/game/lift";
import { LIFT_SIMS, liftSeed } from "@shared/game/run";
import { LIFTS, type Character, type LiftId, type LiftScores, type RunLogs } from "@shared/game/types";

/** 3-2-1 countdown once the player taps to start a lift. */
export const INTRO_TICKS = 300;
/** If nobody taps, the explainer starts the countdown on its own (keeps runs inside the token's time limit). */
export const AUTO_START_TICKS = 2000;

export type CircuitPhase =
  | { kind: "intro"; lift: LiftId; ticksLeft: number; npc: boolean; ready: boolean; waited: number }
  | { kind: "lift"; lift: LiftId }
  | { kind: "done" };

/** Sequences intro → lift for bench, squat, deadlift. Input only reaches a lift while it's running. */
export class Circuit {
  phase: CircuitPhase = { kind: "intro", lift: "bench", ticksLeft: INTRO_TICKS, npc: false, ready: false, waited: 0 };
  current: LiftRunner<LiftStateBase> | null = null;
  private finished: Partial<Record<LiftId, LiftRunner<LiftStateBase>>> = {};

  constructor(private readonly seed: number, readonly character: Character) {}

  get done() {
    return this.phase.kind === "done";
  }

  setDown(down: boolean) {
    // On the explainer, a tap starts the countdown; it never reaches the lift.
    if (this.phase.kind === "intro") {
      if (down) this.phase.ready = true;
      return;
    }
    if (this.phase.kind === "lift") this.current?.setDown(down);
  }

  tick() {
    const p = this.phase;
    if (p.kind === "intro") {
      p.waited++;
      if (!p.ready) {
        if (p.waited >= AUTO_START_TICKS) p.ready = true;
        return;
      }
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
          ? { kind: "intro", lift: next, ticksLeft: INTRO_TICKS, npc: next === "deadlift", ready: false, waited: 0 }
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
