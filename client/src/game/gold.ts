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
