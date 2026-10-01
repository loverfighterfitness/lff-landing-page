import { COMBO_MAX_MULT, COMBO_STEP } from "./config";

export function comboMultiplier(combo: number): number {
  return Math.min(COMBO_MAX_MULT, 1 + COMBO_STEP * combo);
}

/** Points for one rep at the current combo. */
export function award(base: number, combo: number): number {
  return Math.round(base * comboMultiplier(combo));
}
