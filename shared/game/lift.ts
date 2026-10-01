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
    // While swallowing, ignore any down=true (only release clears it)
    if (this.swallowing && down) return;
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
