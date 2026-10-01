/**
 * LFF brand palette, matching the carousel and reel templates.
 * Brown and cream carry everything; baby blue is the single accent, used sparingly for the one
 * thing that matters (selected, perfect, your row). A muted red marks the one bad thing (a miss).
 */
export const INK = "#2A1F15";
export const BROWN = "#54412F";
export const CREAM = "#EAE6D2";
export const TAUPE = "#8A7060";
export const STONE = "#D4CEBA";
export const BLUE = "#A9D4F5";
export const BAD = "#B5523F";

/** Film grain lifted from the LFF landing page and carousels. */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Game art is served with a 7-day cache (and Cloudflare in front), so re-drawn files with the same
 * name would keep showing the old version. Bump this whenever any file in /public/game changes.
 */
export const ASSET_VERSION = "2026-10-01d";

/** URL for a file in /public/game with the cache-busting version attached. */
export function gameAsset(path: string): string {
  return `/game/${path}?v=${ASSET_VERSION}`;
}
