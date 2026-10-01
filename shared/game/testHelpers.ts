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
