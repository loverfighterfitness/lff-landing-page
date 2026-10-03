/**
 * Promo codes that arrive by link (e.g. the game's consolation prize: /?promo=GAME#coaching).
 * The code is remembered on this device and sent with coaching checkout, where the server looks it
 * up in Stripe and applies it — Stripe enforces expiry and first-time-customer rules.
 */
const KEY = "lff_promo_code";

/** Codes we show a banner for. Unknown codes are ignored. */
export const PROMOS: Record<string, { headline: string; detail: string }> = {
  GAME: {
    headline: "Game prize unlocked: half-price first month",
    detail: "50% off every payment in your first month of coaching, applied automatically at checkout. New clients only, ends 17 Oct.",
  },
};

/** Read ?promo= from the URL (if it's one we know), remember it, and return the active code. */
export function capturePromo(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("promo")?.toUpperCase();
    if (fromUrl && PROMOS[fromUrl]) localStorage.setItem(KEY, fromUrl);
  } catch {
    /* storage blocked */
  }
  return activePromo();
}

export function activePromo(): string | null {
  try {
    const code = localStorage.getItem(KEY);
    return code && PROMOS[code] ? code : null;
  } catch {
    return null;
  }
}
